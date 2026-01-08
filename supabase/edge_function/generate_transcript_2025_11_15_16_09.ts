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

    const { student_id, transcript_type = 'official' } = await req.json()

    if (!student_id) {
      return new Response(
        JSON.stringify({ error: 'Student ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get student profile
    const { data: student, error: studentError } = await supabaseClient
      .from('user_profiles_2025_11_15_16_09')
      .select('*')
      .eq('user_id', student_id)
      .single()

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get academic records
    const { data: records, error: recordsError } = await supabaseClient
      .from('academic_records_2025_11_15_16_09')
      .select(`
        *,
        courses_2025_11_15_16_09 (
          title,
          course_code,
          credits,
          category
        )
      `)
      .eq('student_id', student_id)
      .eq('completion_status', 'completed')
      .order('academic_year', { ascending: true })
      .order('semester', { ascending: true })

    if (recordsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch academic records' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate totals and GPA
    const totalCreditsEarned = records?.reduce((sum, record) => sum + record.credits_earned, 0) || 0
    const totalGradePoints = records?.reduce((sum, record) => sum + (record.grade_points * record.credits_earned), 0) || 0
    const cumulativeGPA = totalCreditsEarned > 0 ? (totalGradePoints / totalCreditsEarned).toFixed(2) : '0.00'

    // Determine academic standing
    let academicStanding = 'good'
    const gpaValue = parseFloat(cumulativeGPA)
    if (gpaValue >= 3.5) academicStanding = 'excellent'
    else if (gpaValue < 2.0) academicStanding = 'probation'

    // Generate verification code
    const verificationCode = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create transcript record
    const { data: transcript, error: transcriptError } = await supabaseClient
      .from('transcripts_2025_11_15_16_09')
      .insert({
        student_id: student_id,
        transcript_type: transcript_type,
        total_credits_attempted: totalCreditsEarned,
        total_credits_earned: totalCreditsEarned,
        cumulative_gpa: parseFloat(cumulativeGPA),
        academic_standing: academicStanding,
        verification_code: verificationCode,
        is_official: transcript_type === 'official'
      })
      .select()
      .single()

    if (transcriptError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create transcript record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate HTML transcript
    const transcriptHTML = generateTranscriptHTML(student, records, transcript)

    return new Response(
      JSON.stringify({
        success: true,
        transcript: transcript,
        html: transcriptHTML,
        verification_code: verificationCode
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating transcript:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateTranscriptHTML(student: any, records: any[], transcript: any) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const recordsHTML = records?.map(record => `
    <tr>
      <td>${record.courses_2025_11_15_16_09?.course_code || 'N/A'}</td>
      <td>${record.courses_2025_11_15_16_09?.title || 'N/A'}</td>
      <td>${record.credits_earned}</td>
      <td>${record.final_grade}</td>
      <td>${record.grade_points.toFixed(2)}</td>
      <td>${record.semester} ${record.academic_year}</td>
    </tr>
  `).join('') || '<tr><td colspan="6">No completed courses found</td></tr>'

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Official Transcript - ${student.full_name}</title>
        <style>
            body {
                font-family: 'Times New Roman', serif;
                margin: 0;
                padding: 20px;
                background: white;
                color: #333;
            }
            .transcript-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border: 2px solid #2d5a27;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #2d5a27;
                padding-bottom: 20px;
            }
            .institution-name {
                font-size: 28px;
                font-weight: bold;
                color: #2d5a27;
                margin-bottom: 5px;
            }
            .institution-subtitle {
                font-size: 16px;
                color: #666;
                margin-bottom: 10px;
            }
            .transcript-title {
                font-size: 24px;
                font-weight: bold;
                color: #2d5a27;
                margin-top: 20px;
            }
            .student-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 30px 0;
                padding: 20px;
                background: #f8f9fa;
                border-left: 4px solid #2d5a27;
            }
            .info-group {
                margin-bottom: 10px;
            }
            .info-label {
                font-weight: bold;
                color: #2d5a27;
                display: inline-block;
                width: 120px;
            }
            .courses-table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
            }
            .courses-table th,
            .courses-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            .courses-table th {
                background: #2d5a27;
                color: white;
                font-weight: bold;
            }
            .courses-table tr:nth-child(even) {
                background: #f8f9fa;
            }
            .summary {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
                padding: 20px;
                background: #f0f8f0;
                border: 1px solid #2d5a27;
            }
            .summary-item {
                margin-bottom: 10px;
            }
            .summary-label {
                font-weight: bold;
                color: #2d5a27;
                display: inline-block;
                width: 180px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #2d5a27;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            .verification {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
                border-radius: 5px;
            }
            .arabic-text {
                font-family: 'Amiri', 'Times New Roman', serif;
                direction: rtl;
                text-align: center;
                color: #2d5a27;
                font-size: 18px;
                margin: 10px 0;
            }
            @media print {
                body { margin: 0; padding: 0; }
                .transcript-container { border: none; box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="transcript-container">
            <div class="header">
                <div class="institution-name">Madrasa Al-Hikmah</div>
                <div class="arabic-text">مدرسة الحكمة</div>
                <div class="institution-subtitle">Islamic Learning Institution</div>
                <div class="institution-subtitle">123 Islamic Center Drive, Knowledge City, KC 12345</div>
                <div class="transcript-title">OFFICIAL ACADEMIC TRANSCRIPT</div>
            </div>

            <div class="student-info">
                <div>
                    <div class="info-group">
                        <span class="info-label">Student Name:</span>
                        <span>${student.full_name}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Student ID:</span>
                        <span>${student.student_id}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Date of Birth:</span>
                        <span>${student.date_of_birth || 'Not provided'}</span>
                    </div>
                </div>
                <div>
                    <div class="info-group">
                        <span class="info-label">Enrollment Date:</span>
                        <span>${new Date(student.enrollment_date).toLocaleDateString()}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Status:</span>
                        <span>${student.status.charAt(0).toUpperCase() + student.status.slice(1)}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Generated:</span>
                        <span>${currentDate}</span>
                    </div>
                </div>
            </div>

            <table class="courses-table">
                <thead>
                    <tr>
                        <th>Course Code</th>
                        <th>Course Title</th>
                        <th>Credits</th>
                        <th>Grade</th>
                        <th>Grade Points</th>
                        <th>Term</th>
                    </tr>
                </thead>
                <tbody>
                    ${recordsHTML}
                </tbody>
            </table>

            <div class="summary">
                <div>
                    <div class="summary-item">
                        <span class="summary-label">Total Credits Attempted:</span>
                        <span>${transcript.total_credits_attempted}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Credits Earned:</span>
                        <span>${transcript.total_credits_earned}</span>
                    </div>
                </div>
                <div>
                    <div class="summary-item">
                        <span class="summary-label">Cumulative GPA:</span>
                        <span>${transcript.cumulative_gpa}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Academic Standing:</span>
                        <span>${transcript.academic_standing.charAt(0).toUpperCase() + transcript.academic_standing.slice(1)}</span>
                    </div>
                </div>
            </div>

            <div class="verification">
                <strong>Verification Code: ${transcript.verification_code}</strong><br>
                This transcript can be verified at our official website using the above code.
            </div>

            <div class="footer">
                <p><strong>Madrasa Al-Hikmah - Islamic Learning Institution</strong></p>
                <p>This is an official academic transcript. Any alteration or forgery is strictly prohibited.</p>
                <p>Generated on ${currentDate} | Transcript Type: ${transcript.transcript_type.toUpperCase()}</p>
                <div class="arabic-text" style="font-size: 14px; margin-top: 10px;">
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                </div>
            </div>
        </div>
    </body>
    </html>
  `
}