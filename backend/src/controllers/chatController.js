import prisma from '../config/prisma.js';
import { routeQuery } from '../services/queryRouter.js';
import { runRag } from '../services/ragPipeline.js';
import { runLcp } from '../services/lcpPipeline.js';

async function canAccessLesson(userId, lesson) {
  const firstTwoLessons = await prisma.lesson.findMany({
    where: { course_id: lesson.course_id },
    orderBy: { order_index: 'asc' },
    take: 2,
    select: { lesson_id: true },
  });

  const isFreeLesson = firstTwoLessons.some((item) => item.lesson_id === lesson.lesson_id);
  if (isFreeLesson) return true;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      user_id: userId,
      course_id: lesson.course_id,
      is_paid: true,
    },
  });

  return Boolean(enrollment);
}

export const chat = async (req, res, next) => {
  try {
    const { lesson_id, messages } = req.body;
    const userId = req.user.userId;

    if (!lesson_id || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Thieu lesson_id hoac messages khong hop le' });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { lesson_id: Number(lesson_id) },
      include: { course: true },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Khong tim thay bai hoc' });
    }

    if (!(await canAccessLesson(userId, lesson))) {
      return res.status(403).json({ message: 'Ban chua dang ky khoa hoc nay' });
    }

    const userMessages = messages.filter((message) => message.role === 'user');
    if (userMessages.length === 0) {
      return res.status(400).json({ message: 'Khong co cau hoi nao tu user' });
    }

    const latestQuery = userMessages[userMessages.length - 1].content;
    const historyMessages = messages
      .slice(0, -1)
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    const routingResult = routeQuery(latestQuery);
    const { strategy, score, confidence } = routingResult;

    console.log(
      `[DRA] Query="${latestQuery.slice(0, 80)}" | Strategy=${strategy} | Score=${score} | Confidence=${confidence}`,
    );

    let result;
    let routing;

    if (strategy === 'LCP') {
      result = await runLcp(Number(lesson_id), latestQuery, historyMessages);
      routing = {
        strategy: 'LCP',
        score,
        confidence,
        contextSize: result.contextSize,
      };
    } else {
      result = await runRag(Number(lesson_id), latestQuery, historyMessages);
      routing = {
        strategy: 'RAG',
        score,
        confidence,
        sourceChunks: result.sourceChunks,
      };
    }

    return res.status(200).json({
      answer: result.answer,
      reply: result.answer,
      routing,
    });
  } catch (error) {
    console.error('[chatController] Loi DRA chat:', error.message);
    next(error);
  }
};

export const askChatbot = chat;
