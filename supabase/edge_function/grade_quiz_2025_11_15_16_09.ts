import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { quiz_attempt_id, student_answers } = await req.json()

    if (!quiz_attempt_id || !student_answers) {
      return new Response(
        JSON.stringify({ error: 'Quiz attempt ID and student answers are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get quiz attempt details
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('quiz_attempts_2025_11_15_16_09')
      .select(`
        *,
        quizzes_2025_11_15_16_09 (
          id,
          title,
          max_points,
          show_correct_answers
        )
      `)
      .eq('id', quiz_attempt_id)
      .single()

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Quiz attempt not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get quiz questions with correct answers
    const { data: questions, error: questionsError } = await supabaseClient
      .from('quiz_questions_2025_11_15_16_09')
      .select('*')
      .eq('quiz_id', attempt.quiz_id)
      .order('question_order')

    if (questionsError || !questions) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch quiz questions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Grade the quiz
    let totalScore = 0
    let maxScore = 0
    const gradingResults = []

    for (const question of questions) {
      maxScore += question.points
      const studentAnswer = student_answers[question.id]
      let isCorrect = false
      let pointsEarned = 0

      if (studentAnswer) {
        switch (question.question_type) {
          case 'multiple_choice':
          case 'true_false':
            isCorrect = studentAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()
            pointsEarned = isCorrect ? question.points : 0
            break
          
          case 'short_answer':
            // Simple text matching for short answers
            const correctAnswer = question.correct_answer.toLowerCase().trim()
            const studentAnswerText = studentAnswer.toLowerCase().trim()
            isCorrect = correctAnswer === studentAnswerText || 
                       correctAnswer.includes(studentAnswerText) ||
                       studentAnswerText.includes(correctAnswer)
            pointsEarned = isCorrect ? question.points : 0
            break
          
          case 'fill_blank':
            // Check if the answer contains the correct word/phrase
            const correctFill = question.correct_answer.toLowerCase().trim()
            const studentFill = studentAnswer.toLowerCase().trim()
            isCorrect = correctFill === studentFill
            pointsEarned = isCorrect ? question.points : 0
            break
          
          case 'essay':
            // Essay questions need manual grading, assign partial points for attempt
            pointsEarned = studentAnswer.trim().length > 10 ? Math.floor(question.points * 0.5) : 0
            isCorrect = false // Will need manual review
            break
          
          default:
            pointsEarned = 0
            isCorrect = false
        }
      }

      totalScore += pointsEarned
      
      gradingResults.push({
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        student_answer: studentAnswer || '',
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        points_possible: question.points,
        points_earned: pointsEarned,
        explanation: question.explanation || ''
      })
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const completedAt = new Date().toISOString()

    // Update quiz attempt with results
    const { error: updateError } = await supabaseClient
      .from('quiz_attempts_2025_11_15_16_09')
      .update({
        completed_at: completedAt,
        score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        answers: student_answers,
        is_completed: true,
        updated_at: completedAt
      })
      .eq('id', quiz_attempt_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update quiz attempt' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate time taken
    const startTime = new Date(attempt.started_at)
    const endTime = new Date(completedAt)
    const timeTakenMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    // Update time taken
    await supabaseClient
      .from('quiz_attempts_2025_11_15_16_09')
      .update({ time_taken_minutes: timeTakenMinutes })
      .eq('id', quiz_attempt_id)

    // Determine grade letter
    let gradeLetter = 'F'
    if (percentage >= 90) gradeLetter = 'A'
    else if (percentage >= 80) gradeLetter = 'B'
    else if (percentage >= 70) gradeLetter = 'C'
    else if (percentage >= 60) gradeLetter = 'D'

    // Generate feedback
    const feedback = generateQuizFeedback(percentage, gradingResults, attempt.quizzes_2025_11_15_16_09.show_correct_answers)

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          quiz_attempt_id: quiz_attempt_id,
          total_score: totalScore,
          max_score: maxScore,
          percentage: Math.round(percentage * 100) / 100,
          grade_letter: gradeLetter,
          time_taken_minutes: timeTakenMinutes,
          completed_at: completedAt,
          feedback: feedback,
          grading_details: attempt.quizzes_2025_11_15_16_09.show_correct_answers ? gradingResults : null
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error grading quiz:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateQuizFeedback(percentage: number, gradingResults: any[], showCorrectAnswers: boolean) {
  let feedback = ''
  
  if (percentage >= 90) {
    feedback = 'Excellent work! You have demonstrated mastery of the material. May Allah bless your studies.'
  } else if (percentage >= 80) {
    feedback = 'Very good performance! You have a strong understanding of the concepts. Continue your dedicated studies.'
  } else if (percentage >= 70) {
    feedback = 'Good effort! You have grasped most of the material. Review the areas where you missed questions for improvement.'
  } else if (percentage >= 60) {
    feedback = 'Satisfactory performance. Please review the material more thoroughly and consider seeking additional help from your instructor.'
  } else {
    feedback = 'This quiz indicates you need to spend more time studying the material. Please review your notes and consider meeting with your instructor for guidance.'
  }

  if (showCorrectAnswers) {
    const incorrectCount = gradingResults.filter(r => !r.is_correct).length
    if (incorrectCount > 0) {
      feedback += ` You missed ${incorrectCount} question${incorrectCount > 1 ? 's' : ''}. Review the correct answers provided to strengthen your understanding.`
    }
  }

  feedback += ' Remember: "وَقُل رَّبِّ زِدْنِي عِلْمًا" - "And say: My Lord, increase me in knowledge." (Quran 20:114)'

  return feedback
}