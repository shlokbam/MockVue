"""
Run this script once to populate the questions table.
Usage: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

QUESTIONS = [
    # ── JPMorgan Chase ──────────────────────────────────────────────────────
    {
        "company": "JPMorgan",
        "role": "Software Engineer",
        "question_text": "Tell me about yourself.",
        "rubric": [
            {"point": "Introduced yourself clearly with name and background", "points": 8},
            {"point": "Mentioned relevant technical skills or education", "points": 8},
            {"point": "Gave a specific project example with outcomes", "points": 8},
            {"point": "Stated a clear career goal", "points": 8},
            {"point": "Connected your answer to JPMorgan specifically", "points": 8},
        ],
        "model_answer": "I'm [Name], a final-year Computer Science student at [University]. I'm passionate about building scalable backend systems — I've worked with Java, Python, and React. In my last internship I built a REST API that reduced data fetch latency by 40%. I'm particularly drawn to JPMorgan because of its investment in FinTech innovation and the engineering challenges at scale."
    },
    {
        "company": "JPMorgan",
        "role": "Software Engineer",
        "question_text": "Describe a technical challenge you faced and how you solved it.",
        "rubric": [
            {"point": "Clearly described the technical problem", "points": 8},
            {"point": "Explained your thought process and approach", "points": 8},
            {"point": "Mentioned specific technologies or tools used", "points": 8},
            {"point": "Quantified the result or outcome", "points": 8},
            {"point": "Reflected on what you learned", "points": 8},
        ],
        "model_answer": "During my internship, our microservice was crashing under load. I profiled the code with py-spy and found an N+1 database query bug. I refactored the ORM queries to use join fetching, reducing DB calls from 200 to 10 per request. Response time improved by 60%. I learned the importance of profiling before optimising."
    },
    {
        "company": "JPMorgan",
        "role": "Software Engineer",
        "question_text": "Why do you want to work at JPMorgan Chase?",
        "rubric": [
            {"point": "Mentioned specific JPMorgan initiatives or products", "points": 10},
            {"point": "Connected your skills to JPMorgan's technology needs", "points": 10},
            {"point": "Showed knowledge of JPMorgan's culture or values", "points": 10},
            {"point": "Expressed genuine enthusiasm, not generic praise", "points": 10},
        ],
        "model_answer": "JPMorgan's investment in COIN and its cloud-first engineering strategy genuinely excites me. The scale of problems — processing millions of transactions securely — is exactly the kind of engineering challenge I want to work on. I've also read about JPMorgan's Code For Good initiative which aligns with my values of tech for social impact."
    },
    {
        "company": "JPMorgan",
        "role": "Software Engineer",
        "question_text": "Tell me about a time you worked effectively in a team.",
        "rubric": [
            {"point": "Described your specific role in the team", "points": 8},
            {"point": "Explained the team's goal or challenge", "points": 8},
            {"point": "Mentioned how you communicated or collaborated", "points": 8},
            {"point": "Described the outcome achieved together", "points": 8},
            {"point": "Showed what you contributed uniquely", "points": 8},
        ],
        "model_answer": "In my final year project, I was the backend lead in a team of four. We were building a real-time chat application. I coordinated daily standups, set up our Git workflow, and handled the WebSocket server while others handled frontend and design. We delivered on time and got an A. My communication kept the team aligned despite different schedules."
    },
    {
        "company": "JPMorgan",
        "role": "Software Engineer",
        "question_text": "Where do you see yourself in 5 years?",
        "rubric": [
            {"point": "Gave a specific and realistic career vision", "points": 10},
            {"point": "Aligned your goals with engineering growth at JPMorgan", "points": 10},
            {"point": "Mentioned skills you plan to develop", "points": 10},
            {"point": "Showed ambition without being unrealistic", "points": 10},
        ],
        "model_answer": "In five years I see myself as a senior engineer leading a product team, ideally in JPMorgan's FinTech division. I want to deepen my expertise in distributed systems and cloud architecture. I also want to mentor junior engineers. JPMorgan's scale and growth opportunities make it an ideal place to reach those goals."
    },

    # ── Goldman Sachs ───────────────────────────────────────────────────────
    {
        "company": "Goldman Sachs",
        "role": "Software Engineer",
        "question_text": "Tell me about yourself.",
        "rubric": [
            {"point": "Gave a clear and concise personal introduction", "points": 8},
            {"point": "Highlighted technical skills relevant to Goldman Sachs", "points": 8},
            {"point": "Mentioned a concrete project or achievement", "points": 8},
            {"point": "Expressed a clear career motivation", "points": 8},
            {"point": "Connected their background to Goldman Sachs's engineering or finance domain", "points": 8},
        ],
        "model_answer": "I'm a final year CS student with a strong foundation in Python and data structures. I've built a stock portfolio tracker as a side project using FastAPI and React. I'm passionate about the intersection of technology and finance — Goldman Sachs's SecDB platform and engineering-first culture are exactly the environment I want to grow in."
    },
    {
        "company": "Goldman Sachs",
        "role": "Software Engineer",
        "question_text": "Explain a complex technical concept to a non-technical person.",
        "rubric": [
            {"point": "Chose an appropriate technical concept", "points": 8},
            {"point": "Used a clear and relatable analogy", "points": 8},
            {"point": "Avoided jargon or explained terms when used", "points": 8},
            {"point": "Showed empathy for the audience's perspective", "points": 8},
            {"point": "Structured the explanation logically", "points": 8},
        ],
        "model_answer": "I'd explain machine learning as teaching by example — like training a dog. Instead of writing rules, you show the system thousands of examples and it learns the pattern. If you show it 1000 photos of cats and dogs, it learns to tell them apart. The more examples, the smarter it gets."
    },
    {
        "company": "Goldman Sachs",
        "role": "Software Engineer",
        "question_text": "Why Goldman Sachs?",
        "rubric": [
            {"point": "Referenced Goldman Sachs products or initiatives specifically", "points": 10},
            {"point": "Demonstrated knowledge of Goldman's technology culture", "points": 10},
            {"point": "Aligned personal values or goals with Goldman Sachs", "points": 10},
            {"point": "Showed genuine rather than generic motivation", "points": 10},
        ],
        "model_answer": "Goldman's engineering teams are building some of the most complex real-time financial systems in the world — the scale of SecDB and their transition to cloud is fascinating to me. I also value Goldman's commitment to excellence and high standards which aligns with how I approach my own work."
    },
    {
        "company": "Goldman Sachs",
        "role": "Software Engineer",
        "question_text": "Describe a time you had to learn something new very quickly.",
        "rubric": [
            {"point": "Clearly described the learning need or pressure", "points": 8},
            {"point": "Explained how you structured your learning", "points": 8},
            {"point": "Mentioned specific resources or strategies used", "points": 8},
            {"point": "Showed the outcome or how you applied the learning", "points": 8},
            {"point": "Reflected on the lesson learned about learning itself", "points": 8},
        ],
        "model_answer": "In my internship, I had to learn Kubernetes in one week before a deployment. I created a structured 7-day plan — tutorials in the morning, hands-on practice in the afternoon. I deployed our first containerised service on day 7. I learned that structured self-study with immediate application is how I learn best."
    },
    {
        "company": "Goldman Sachs",
        "role": "Software Engineer",
        "question_text": "How do you handle pressure and tight deadlines?",
        "rubric": [
            {"point": "Gave a specific real example of working under pressure", "points": 10},
            {"point": "Described your prioritisation strategy", "points": 10},
            {"point": "Mentioned communication with the team or manager", "points": 10},
            {"point": "Showed a positive outcome or learning", "points": 10},
        ],
        "model_answer": "During exam season, I had to deliver a client freelance project with a 48-hour deadline. I listed all tasks, prioritised by dependency, and worked in 2-hour focused blocks. I communicated proactively with the client about scope. I delivered on time and they extended the contract. Pressure clarifies my thinking."
    },

    # ── TCS ─────────────────────────────────────────────────────────────────
    {
        "company": "TCS",
        "role": "Software Engineer",
        "question_text": "Tell me about yourself.",
        "rubric": [
            {"point": "Gave a structured professional introduction", "points": 8},
            {"point": "Mentioned educational background and relevant coursework", "points": 8},
            {"point": "Described at least one project or internship", "points": 8},
            {"point": "Mentioned a soft skill with an example", "points": 8},
            {"point": "Expressed interest in TCS specifically", "points": 8},
        ],
        "model_answer": "I'm a Computer Science graduate with a CGPA of 8.5. During my studies I completed a machine learning project predicting student dropout rates, which was published in a college journal. I also did a summer internship at a startup where I worked on their React frontend. I value collaboration and am excited about TCS's scale and global exposure."
    },
    {
        "company": "TCS",
        "role": "Software Engineer",
        "question_text": "What are your strengths and weaknesses?",
        "rubric": [
            {"point": "Mentioned a genuine and relevant strength", "points": 10},
            {"point": "Gave a concrete example demonstrating the strength", "points": 10},
            {"point": "Mentioned a real weakness, not a disguised strength", "points": 10},
            {"point": "Explained what you are doing to improve on the weakness", "points": 10},
        ],
        "model_answer": "My strength is problem decomposition — I can break complex problems into small solvable parts systematically. In my final project this helped our team deliver on time. My weakness is that I sometimes overthink before starting. I've been working on this by setting a 15-minute timer before I start any task — ship first, optimise later."
    },
    {
        "company": "TCS",
        "role": "Software Engineer",
        "question_text": "Why do you want to join TCS?",
        "rubric": [
            {"point": "Mentioned TCS-specific facts or programs", "points": 10},
            {"point": "Connected TCS's size or projects to personal goals", "points": 10},
            {"point": "Showed awareness of TCS's culture of learning", "points": 10},
            {"point": "Expressed genuine fit between self and TCS", "points": 10},
        ],
        "model_answer": "TCS's scale is remarkable — working on projects serving millions of users globally is the kind of exposure I can't get at a startup. I'm particularly interested in TCS's digital transformation projects and the TCS Xplore learning program which shows commitment to employee growth. I want to build expertise in enterprise system design."
    },
    {
        "company": "TCS",
        "role": "Software Engineer",
        "question_text": "Describe a situation where you showed leadership.",
        "rubric": [
            {"point": "Clearly described a leadership situation", "points": 8},
            {"point": "Explained what actions you took as a leader", "points": 8},
            {"point": "Showed how you motivated or guided others", "points": 8},
            {"point": "Described the result of your leadership", "points": 8},
            {"point": "Reflected on what the experience taught you", "points": 8},
        ],
        "model_answer": "In our capstone project, two teammates were struggling with the ML model while we had a deadline in 3 days. I took initiative, reorganised our task breakdown, ran two focused debugging sessions, and we solved the core bug together. We submitted on time and got top marks. I learned that leading means removing blockers for others."
    },
    {
        "company": "TCS",
        "role": "Software Engineer",
        "question_text": "How do you stay updated with new technology?",
        "rubric": [
            {"point": "Mentioned specific sources or platforms used", "points": 10},
            {"point": "Gave an example of something recently learned", "points": 10},
            {"point": "Showed a consistent learning habit or routine", "points": 10},
            {"point": "Connected learning to practical application", "points": 10},
        ],
        "model_answer": "I follow a few tech newsletters — Bytes.dev and TLDR Tech — and spend 30 minutes every morning on them. I also do at least one project per quarter with a technology I haven't used before. Recently I built a small app with Next.js 14's server components. I believe consistent small learning compounds into major skill growth."
    },

    # ── Infosys ─────────────────────────────────────────────────────────────
    {
        "company": "Infosys",
        "role": "Software Engineer",
        "question_text": "Tell me about yourself.",
        "rubric": [
            {"point": "Clearly introduced yourself with name and background", "points": 8},
            {"point": "Mentioned relevant technical skills", "points": 8},
            {"point": "Described a project or practical experience", "points": 8},
            {"point": "Mentioned awareness of Infosys or its services", "points": 8},
            {"point": "Conveyed enthusiasm and confidence", "points": 8},
        ],
        "model_answer": "I'm a final year BCA student with strong skills in Java and database management. I developed a hospital management system for my final project using Spring Boot and MySQL. I'm familiar with Infosys's work in digital transformation and cloud migration. I'm excited to contribute to large-scale enterprise projects."
    },
    {
        "company": "Infosys",
        "role": "Software Engineer",
        "question_text": "What do you know about Infosys?",
        "rubric": [
            {"point": "Mentioned Infosys's founding or history accurately", "points": 8},
            {"point": "Referenced Infosys's main service areas", "points": 8},
            {"point": "Mentioned specific products like Finacle or Cobalt", "points": 8},
            {"point": "Referenced Infosys's training and culture", "points": 8},
            {"point": "Connected Infosys's work to your own interest", "points": 8},
        ],
        "model_answer": "Infosys was founded in 1981 and is now one of India's biggest IT companies, serving clients in 50+ countries. They're known for digital transformation, cloud services, and products like Finacle for banking. I'm particularly impressed by Infosys Springboard and their commitment to upskilling millions. That aligns with my own belief in lifelong learning."
    },
    {
        "company": "Infosys",
        "role": "Software Engineer",
        "question_text": "How do you manage multiple tasks?",
        "rubric": [
            {"point": "Described a specific prioritisation method", "points": 10},
            {"point": "Gave a real example of managing multiple tasks", "points": 10},
            {"point": "Mentioned tools or systems used", "points": 10},
            {"point": "Showed the outcome of managing well", "points": 10},
        ],
        "model_answer": "I use a priority matrix — urgent and important tasks first. I also timebox my day into blocks using Google Calendar. During my internship I was juggling three features at once. I listed everything in Trello by priority, communicated with my manager about deadlines, and delivered all three on time. Structure is how I stay calm under load."
    },
    {
        "company": "Infosys",
        "role": "Software Engineer",
        "question_text": "Tell me about a time you failed and what you learned.",
        "rubric": [
            {"point": "Honestly described a real failure", "points": 10},
            {"point": "Took personal responsibility without blaming others", "points": 10},
            {"point": "Clearly articulated what you learned", "points": 10},
            {"point": "Showed how you've applied that lesson since", "points": 10},
        ],
        "model_answer": "In my second year project, I underestimated the time needed for testing and we submitted with several bugs. We got a lower grade than expected. I took responsibility — I had prioritised features over quality. Since then I allocate 30% of any project timeline purely for testing. That habit has made all my subsequent projects much more reliable."
    },
    {
        "company": "Infosys",
        "role": "Software Engineer",
        "question_text": "Where do you see yourself in 3 years?",
        "rubric": [
            {"point": "Gave a specific and realistic 3-year vision", "points": 10},
            {"point": "Mentioned skills you plan to develop", "points": 10},
            {"point": "Connected your goals to growing within Infosys", "points": 10},
            {"point": "Showed self-awareness about your current level", "points": 10},
        ],
        "model_answer": "In 3 years I want to be a confident mid-level engineer who can independently own modules in a large project. I plan to get certified in cloud (AWS or Azure) within the first year. I see Infosys as the right place because the variety of client projects means I'll be exposed to different domains quickly, accelerating my growth."
    },

    # ── General HR ──────────────────────────────────────────────────────────
    {
        "company": "General HR",
        "role": "General",
        "question_text": "Tell me about yourself.",
        "rubric": [
            {"point": "Gave a clear and professional introduction", "points": 8},
            {"point": "Mentioned educational background", "points": 8},
            {"point": "Highlighted key skills or experiences", "points": 8},
            {"point": "Stated a career goal or direction", "points": 8},
            {"point": "Connected their background to the role or company", "points": 8},
        ],
        "model_answer": "I'm a final year engineering student with a passion for problem-solving and technology. I've developed skills in Python, web development, and data analysis through coursework and personal projects. I'm driven by creating things that have real impact, and I'm looking for a role where I can grow quickly and contribute from day one."
    },
    {
        "company": "General HR",
        "role": "General",
        "question_text": "What is your greatest strength?",
        "rubric": [
            {"point": "Identified a specific and genuine strength", "points": 10},
            {"point": "Gave a concrete example demonstrating the strength", "points": 10},
            {"point": "Connected the strength to professional relevance", "points": 10},
            {"point": "Delivered the answer with confidence", "points": 10},
        ],
        "model_answer": "My greatest strength is analytical thinking. When I face a problem, I naturally break it into smaller parts, identify the root cause, and test solutions systematically. In my final year project, this approach helped our team identify a performance bottleneck that others had missed, saving us two weeks of rework."
    },
    {
        "company": "General HR",
        "role": "General",
        "question_text": "Why should we hire you?",
        "rubric": [
            {"point": "Made a specific and confident value proposition", "points": 10},
            {"point": "Mentioned a unique skill or experience", "points": 10},
            {"point": "Showed understanding of what the role requires", "points": 10},
            {"point": "Provided evidence to back up claims", "points": 10},
        ],
        "model_answer": "You should hire me because I combine strong technical fundamentals with the ability to communicate clearly and work in a team. I've proven I can deliver results under pressure — I completed a full-stack project solo in two weeks for a client. I'm also a fast learner who thrives in new environments."
    },
    {
        "company": "General HR",
        "role": "General",
        "question_text": "How do you handle conflict with a colleague?",
        "rubric": [
            {"point": "Described a real or hypothetical conflict scenario", "points": 10},
            {"point": "Showed calmness and professionalism", "points": 10},
            {"point": "Described taking a constructive approach", "points": 10},
            {"point": "Showed positive resolution or learning", "points": 10},
        ],
        "model_answer": "I believe conflict is often caused by miscommunication. When I disagree with a colleague, I first try to understand their perspective fully before expressing mine. In one group project, a teammate and I disagreed on our tech stack. I listened to their reasoning, shared mine with data, and we found a middle ground. The project went well."
    },
    {
        "company": "General HR",
        "role": "General",
        "question_text": "Do you have any questions for us?",
        "rubric": [
            {"point": "Asked at least one thoughtful question", "points": 10},
            {"point": "Question showed genuine curiosity about the role", "points": 10},
            {"point": "Question was relevant and not easily Googleable", "points": 10},
            {"point": "Showed engagement and enthusiasm", "points": 10},
        ],
        "model_answer": "Yes — I'd love to know what a typical first 90 days looks like for someone in this role. I'm also curious about the biggest challenge the team is currently working on, and how someone in this position would be able to contribute to solving it."
    },

    # ── JPMorgan Business Analyst ────────────────────────────────────────────
    {
        "company": "JPMorgan",
        "role": "Business Analyst",
        "question_text": "Tell me about yourself.",
        "rubric": [
            {"point": "Introduced yourself clearly", "points": 8},
            {"point": "Mentioned analytical or business skills", "points": 8},
            {"point": "Gave a relevant project or experience", "points": 8},
            {"point": "Stated a clear career goal in finance/analytics", "points": 8},
            {"point": "Connected your background to JPMorgan's BA needs", "points": 8},
        ],
        "model_answer": "I'm a final year MBA student specialising in Finance. I have experience analysing market data using Excel and Python, and completed a case study on JPMorgan's retail banking strategy. I'm passionate about using data to drive business decisions, and JPMorgan's scale in financial services is the perfect environment for that."
    },
    {
        "company": "JPMorgan",
        "role": "Business Analyst",
        "question_text": "Walk me through a case where you used data to make a business decision.",
        "rubric": [
            {"point": "Clearly described the business problem", "points": 8},
            {"point": "Explained what data was gathered and how", "points": 8},
            {"point": "Described the analysis performed", "points": 8},
            {"point": "Stated the recommendation or decision made", "points": 8},
            {"point": "Quantified the impact or outcome", "points": 8},
        ],
        "model_answer": "In my internship at a retail company, we had declining sales in one region. I gathered 6 months of sales data, segmented by product category and store. I ran a pivot analysis in Excel and found one product category driven by seasonal demand that we were under-stocking. We adjusted inventory allocation and saw a 15% revenue increase in that region."
    },
    {
        "company": "JPMorgan",
        "role": "Business Analyst",
        "question_text": "How do you prioritise competing business requirements?",
        "rubric": [
            {"point": "Described a clear framework or method", "points": 10},
            {"point": "Gave a real example of competing requirements", "points": 10},
            {"point": "Showed how you involved stakeholders", "points": 10},
            {"point": "Described the outcome of your prioritisation", "points": 10},
        ],
        "model_answer": "I use a value vs effort matrix. I list all requirements, estimate the business value and implementation effort, and prioritise high-value low-effort items first. In my capstone project, we had 15 feature requests from our client. I ran this analysis and we prioritised 5 that delivered 80% of the value. The client was satisfied with the rollout."
    },
    {
        "company": "JPMorgan",
        "role": "Business Analyst",
        "question_text": "Describe a time you had to communicate technical findings to non-technical stakeholders.",
        "rubric": [
            {"point": "Described the technical information that needed communicating", "points": 10},
            {"point": "Explained how you simplified the message", "points": 10},
            {"point": "Mentioned the communication channel or format used", "points": 10},
            {"point": "Described the stakeholder reaction and outcome", "points": 10},
        ],
        "model_answer": "I had to present regression model results to marketing leadership who had no stats background. I translated R-squared into plain English — 'this model explains 80% of what drives customer churn'. I used a visual dashboard instead of tables. The CMO immediately understood which channels to cut, saving 20% of the marketing budget."
    },
    {
        "company": "JPMorgan",
        "role": "Business Analyst",
        "question_text": "What excites you about working in financial services?",
        "rubric": [
            {"point": "Showed genuine interest in financial services", "points": 10},
            {"point": "Referenced specific aspects of the industry", "points": 10},
            {"point": "Connected their skills to the domain", "points": 10},
            {"point": "Showed awareness of current trends in FinTech", "points": 10},
        ],
        "model_answer": "Financial services sit at the intersection of data, risk, and real-world impact — I find that genuinely fascinating. The complexity of risk models and the real consequences of analytical decisions excites me. I'm also interested in how FinTech is disrupting traditional banking. Working at JPMorgan means being at the centre of all of that."
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(models.Question).count()
        if existing > 0:
            print(f"Database already has {existing} questions. Skipping seed.")
            return

        for q in QUESTIONS:
            question = models.Question(
                company=q["company"],
                role=q["role"],
                question_text=q["question_text"],
                rubric=q["rubric"],
                model_answer=q.get("model_answer", "")
            )
            db.add(question)

        db.commit()
        print(f"✅ Seeded {len(QUESTIONS)} questions successfully.")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
