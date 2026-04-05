import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from database import engine, Base, DATABASE_URL

# Standard Grading Rubric for Behavioral/Situational Questions
DEFAULT_RUBRIC = [
    {"point": "Situation/Task Clarity: How clearly was the context described?", "points": 10},
    {"point": "Action Detail: Did the candidate explain THEIR specific actions?", "points": 10},
    {"point": "Result/Impact: Was a clear outcome or learning provided?", "points": 10},
    {"point": "Communication & Tone: Was the response professional and structured?", "points": 10}
]

# The FULL Curated Dataset (270+ Questions)
RAW_DATA = {
    "Google": {
        "Product Manager": [
            "Tell me about a time you identified a user problem that others overlooked. What steps did you take to validate it?",
            "Describe a situation where you had multiple feature requests but limited time. How did you decide what to prioritize?",
            "Tell me about a time your product idea didn’t work as expected. What did you learn and change?",
            "Describe a situation where engineers disagreed with your approach. How did you handle it?",
            "Tell me about a time you had to take a product decision without complete data. What was your reasoning?"
        ],
        "Data Analyst": [
            "Tell me about a time your data analysis changed someone’s decision. What resistance did you face?",
            "Describe a situation where your data was incomplete or inconsistent. How did you still derive insights?",
            "Tell me about a time you found an error in your analysis. How did you handle it?",
            "Describe a situation where stakeholders didn’t understand your insights. How did you communicate better?",
            "Tell me about a time you questioned an assumption using data. What happened next?"
        ],
        "UX Designer": [
            "Tell me about a time users struggled with something you designed. How did you identify and fix it?",
            "Describe a situation where you had to balance user needs with technical limitations.",
            "Tell me about a time your design was rejected. What did you do next?",
            "Describe a situation where you had to redesign something quickly based on feedback.",
            "Tell me about a time you simplified a complex user flow. What was your approach?"
        ],
        "Site Reliability Engineer": [
            "Tell me about a time a system or project failed unexpectedly. How did you respond?",
            "Describe a situation where you had to debug an issue with very little information.",
            "Tell me about a time you prevented a potential failure before it happened.",
            "Describe a situation where you had to choose between quick fix vs long-term solution.",
            "Tell me about a time you automated a repetitive process. What impact did it have?"
        ],
        "Technical Program Manager": [
            "Tell me about a time you had to manage multiple stakeholders with conflicting priorities.",
            "Describe a situation where your project was falling behind schedule. What actions did you take?",
            "Tell me about a time you led a project without having formal authority.",
            "Describe a situation where communication gaps caused issues. How did you fix them?",
            "Tell me about a time you handled ambiguity in a project."
        ]
    },
    "Amazon": {
        "Software Development Engineer": [
            "Tell me about a time you took ownership of a problem that wasn’t assigned to you.",
            "Describe a situation where you had to deliver under a tight deadline. What trade-offs did you make?",
            "Tell me about a time you failed. How did you handle it and what changed afterward?",
            "Describe a situation where you disagreed with your team’s approach. What did you do?",
            "Tell me about a time you improved something without being asked."
        ],
        "Product Manager": [
            "Tell me about a time you prioritized customer needs over technical convenience.",
            "Describe a situation where you had conflicting stakeholder inputs. How did you resolve it?",
            "Tell me about a time you had to launch something quickly with limited resources.",
            "Describe a situation where customer feedback forced you to rethink your approach.",
            "Tell me about a time you made a decision that impacted many users."
        ],
        "Business Analyst": [
            "Tell me about a time your analysis identified a business problem others missed.",
            "Describe a situation where your recommendation was challenged.",
            "Tell me about a time you worked with unclear requirements.",
            "Describe a situation where your insights led to measurable improvement.",
            "Tell me about a time you had to convince someone using data."
        ],
        "Operations Manager": [
            "Tell me about a time things went wrong during execution. How did you recover?",
            "Describe a situation where you improved an inefficient process.",
            "Tell me about a time you handled pressure or peak workload.",
            "Describe a situation where you had to manage a team conflict.",
            "Tell me about a time you ensured deadlines were met despite challenges."
        ],
        "QA Engineer": [
            "Tell me about a time you found a critical issue others missed.",
            "Describe a situation where release pressure conflicted with quality. What did you do?",
            "Tell me about a time you improved a testing process.",
            "Describe a situation where developers disagreed with your bug report.",
            "Tell me about a time you ensured high product quality under constraints."
        ]
    },
    "Microsoft": {
        "Software Engineer": [
            "Tell me about a time you collaborated with others to solve a problem.",
            "Describe a situation where you had to quickly adapt to a change.",
            "Tell me about a time you received constructive criticism. What did you do?",
            "Describe a situation where you helped someone else succeed.",
            "Tell me about a time you handled a challenging bug or issue."
        ],
        "Product Manager": [
            "Tell me about a time you aligned different teams toward a common goal.",
            "Describe a situation where you had to balance user needs with business goals.",
            "Tell me about a time your product decision was questioned.",
            "Describe a situation where you had to pivot your plan.",
            "Tell me about a time you drove impact through a product decision."
        ],
        "Data Scientist": [
            "Tell me about a time your model or analysis didn’t perform as expected.",
            "Describe a situation where you had to explain complex results simply.",
            "Tell me about a time you handled messy or biased data.",
            "Describe a situation where your insights influenced a decision.",
            "Tell me about a time you validated or rejected a hypothesis."
        ],
        "UX Designer": [
            "Tell me about a time you improved accessibility or usability.",
            "Describe a situation where user feedback changed your design direction.",
            "Tell me about a time you collaborated with engineers on design trade-offs.",
            "Describe a situation where you iterated multiple times on a design.",
            "Tell me about a time you solved a user pain point effectively."
        ],
        "Cloud Engineer": [
            "Tell me about a time you deployed or managed a system in production.",
            "Describe a situation where you handled a system outage or failure.",
            "Tell me about a time you improved scalability or reliability.",
            "Describe a situation where you automated infrastructure tasks.",
            "Tell me about a time you troubleshot a complex issue."
        ]
    },
    "Adobe": {
        "Software Engineer": [
            "Tell me about a time you had to debug an issue that was blocking others. How did you approach it?",
            "Describe a situation where you improved an existing feature rather than building something new.",
            "Tell me about a time you had to work closely with designers. How did you handle differences in opinion?",
            "Describe a situation where your code caused an issue. How did you respond?",
            "Tell me about a time you had to balance speed of delivery with code quality."
        ],
        "Product Manager": [
            "Tell me about a time you had to understand user pain points deeply before proposing a solution.",
            "Describe a situation where you had to say “no” to a feature request. How did you handle it?",
            "Tell me about a time your product decision was wrong. What did you do next?",
            "Describe a situation where different teams had conflicting priorities.",
            "Tell me about a time you measured the success of a feature."
        ],
        "UX Designer": [
            "Tell me about a time users didn’t understand your design. How did you fix it?",
            "Describe a situation where you had to redesign something under tight timelines.",
            "Tell me about a time feedback forced you to rethink your approach.",
            "Describe a situation where you collaborated with developers to implement design changes.",
            "Tell me about a time you simplified a complex interaction."
        ],
        "Data Analyst": [
            "Tell me about a time your data analysis revealed an unexpected insight.",
            "Describe a situation where stakeholders didn’t trust your data. What did you do?",
            "Tell me about a time you worked with incomplete or dirty data.",
            "Describe a situation where your analysis helped improve a product or process.",
            "Tell me about a time you had to explain data to a non-technical audience."
        ],
        "QA Engineer": [
            "Tell me about a time you caught a critical bug just before release.",
            "Describe a situation where you had to push back on a release due to quality concerns.",
            "Tell me about a time developers disagreed with your test results.",
            "Describe a situation where you improved testing efficiency.",
            "Tell me about a time you ensured quality under tight deadlines."
        ]
    },
    "Meta": {
        "Software Engineer": [
            "Tell me about a time you had to move fast but still maintain quality.",
            "Describe a situation where you handled a performance bottleneck.",
            "Tell me about a time your solution didn’t scale as expected.",
            "Describe a situation where you had to quickly fix a production issue.",
            "Tell me about a time you worked in a highly collaborative environment."
        ],
        "Product Manager": [
            "Tell me about a time you focused on maximizing user engagement.",
            "Describe a situation where you had to prioritize speed over perfection.",
            "Tell me about a time user feedback changed your roadmap.",
            "Describe a situation where you launched something quickly and iterated later.",
            "Tell me about a time you measured product success using metrics."
        ],
        "Data Scientist": [
            "Tell me about a time you designed an experiment (A/B test).",
            "Describe a situation where your hypothesis was wrong.",
            "Tell me about a time you worked with large-scale data.",
            "Describe a situation where your insights influenced product changes.",
            "Tell me about a time you simplified complex findings for others."
        ],
        "UX Designer": [
            "Tell me about a time you designed for a large user base with different needs.",
            "Describe a situation where you iterated rapidly on a design.",
            "Tell me about a time you handled conflicting feedback.",
            "Describe a situation where you improved user engagement through design.",
            "Tell me about a time you made a design decision with limited data."
        ],
        "Program Manager": [
            "Tell me about a time you managed multiple teams working on the same project.",
            "Describe a situation where deadlines were at risk. What did you do?",
            "Tell me about a time you resolved conflict between teams.",
            "Describe a situation where communication breakdown caused issues.",
            "Tell me about a time you delivered results under pressure."
        ]
    },
    "Netflix": {
        "Software Engineer": [
            "Tell me about a time you owned a system or feature end-to-end.",
            "Describe a situation where you improved system performance.",
            "Tell me about a time you handled a production failure.",
            "Describe a situation where you made a trade-off between reliability and speed.",
            "Tell me about a time you made a decision independently."
        ],
        "Data Engineer": [
            "Tell me about a time you built or improved a data pipeline.",
            "Describe a situation where data quality was an issue.",
            "Tell me about a time you optimized data processing.",
            "Describe a situation where you handled large-scale data challenges.",
            "Tell me about a time you ensured reliability in data systems."
        ],
        "Product Manager": [
            "Tell me about a time you made a product decision with limited information.",
            "Describe a situation where you focused on user satisfaction.",
            "Tell me about a time you handled ambiguity in a product decision.",
            "Describe a situation where you measured product success.",
            "Tell me about a time you had to defend your product decision."
        ],
        "Content Analyst": [
            "Tell me about a time you analyzed user behavior patterns.",
            "Describe a situation where your insights influenced recommendations.",
            "Tell me about a time you handled ambiguous data.",
            "Describe a situation where you communicated insights clearly.",
            "Tell me about a time you identified a trend early."
        ],
        "QA Engineer": [
            "Tell me about a time you ensured quality in a high-scale system.",
            "Describe a situation where you automated testing.",
            "Tell me about a time you caught a critical issue.",
            "Describe a situation where release timelines were tight.",
            "Tell me about a time you improved testing processes."
        ]
    },
    "Flipkart": {
        "Software Engineer": [
            "Tell me about a time you optimized performance in a project.",
            "Describe a situation where your code had to handle scale.",
            "Tell me about a time you debugged a complex issue.",
            "Describe a situation where you worked under tight deadlines.",
            "Tell me about a time you improved an existing system."
        ],
        "Product Manager": [
            "Tell me about a time you prioritized user needs over business constraints.",
            "Describe a situation where you handled multiple feature requests.",
            "Tell me about a time you improved customer experience.",
            "Describe a situation where you made trade-offs.",
            "Tell me about a time you used data to guide product decisions."
        ],
        "Product Analyst": [
            "Tell me about a time you analyzed user behavior.",
            "Describe a situation where your insights improved a feature.",
            "Tell me about a time you worked with large datasets.",
            "Describe a situation where you communicated findings.",
            "Tell me about a time you validated assumptions with data."
        ],
        "Operations Executive": [
            "Tell me about a time you handled operational pressure.",
            "Describe a situation where you improved efficiency.",
            "Tell me about a time things didn’t go as planned.",
            "Describe a situation where you coordinated with multiple teams.",
            "Tell me about a time you met tight deadlines."
        ],
        "QA Engineer": [
            "Tell me about a time you ensured product quality before release.",
            "Describe a situation where you found a major issue.",
            "Tell me about a time you improved testing processes.",
            "Describe a situation where you worked with developers.",
            "Tell me about a time you handled release pressure."
        ]
    },
    "Accenture": {
        "Associate Software Engineer": [
            "Tell me about a time you learned a new technology quickly for a project.",
            "Describe a situation where you worked in a team under deadlines.",
            "Tell me about a time you faced a technical challenge.",
            "Describe a situation where you had to communicate your solution clearly.",
            "Tell me about a time you adapted to changing requirements."
        ],
        "Business Analyst": [
            "Tell me about a time you gathered unclear requirements.",
            "Describe a situation where you had to present your ideas.",
            "Tell me about a time you improved a process.",
            "Describe a situation where stakeholders disagreed.",
            "Tell me about a time you used data to support decisions."
        ],
        "Consultant": [
            "Tell me about a time you solved a client-like problem.",
            "Describe a situation where you worked under pressure.",
            "Tell me about a time you influenced someone’s decision.",
            "Describe a situation where you handled ambiguity.",
            "Tell me about a time you delivered results within constraints."
        ],
        "Project Manager": [
            "Tell me about a time you managed a project timeline.",
            "Describe a situation where a project was delayed.",
            "Tell me about a time you handled team conflicts.",
            "Describe a situation where priorities changed.",
            "Tell me about a time you ensured successful delivery."
        ],
        "QA Tester": [
            "Tell me about a time you ensured quality in a project.",
            "Describe a situation where you found critical issues.",
            "Tell me about a time you improved testing.",
            "Describe a situation where you worked with developers.",
            "Tell me about a time you handled deadlines."
        ]
    },
    "Wipro": {
        "Project Engineer": [
            "Tell me about a time you worked in a team with tight deadlines.",
            "Describe a situation where you had to learn a new tool quickly.",
            "Tell me about a time you faced a technical issue and solved it.",
            "Describe a situation where communication helped resolve a problem.",
            "Tell me about a time you took responsibility for a task."
        ],
        "Software Developer": [
            "Tell me about a time you debugged a difficult issue.",
            "Describe a situation where you improved code or logic.",
            "Tell me about a time you collaborated on a project.",
            "Describe a situation where you had to meet a deadline.",
            "Tell me about a time you adapted to changes."
        ],
        "Business Analyst": [
            "Tell me about a time you gathered unclear requirements.",
            "Describe a situation where you presented your findings.",
            "Tell me about a time you improved a process.",
            "Describe a situation where stakeholders disagreed.",
            "Tell me about a time you used data for decisions."
        ],
        "Support Engineer": [
            "Tell me about a time you resolved a technical issue.",
            "Describe a situation where you handled a difficult user.",
            "Tell me about a time you prioritized multiple tasks.",
            "Describe a situation where you worked under pressure.",
            "Tell me about a time you improved service quality."
        ],
        "QA Tester": [
            "Tell me about a time you ensured product quality.",
            "Describe a situation where you found a critical bug.",
            "Tell me about a time you improved testing efficiency.",
            "Describe a situation where deadlines were tight.",
            "Tell me about a time you worked with developers."
        ]
    },
    "Zoho": {
        "Software Developer": [
            "Tell me about a time you built something from scratch.",
            "Describe a situation where you optimized performance.",
            "Tell me about a time you solved a complex problem creatively.",
            "Describe a situation where you improved an existing system.",
            "Tell me about a time you worked independently on a project."
        ],
        "Product Manager": [
            "Tell me about a time you identified a user need.",
            "Describe a situation where you prioritized features.",
            "Tell me about a time you handled feedback.",
            "Describe a situation where you made product trade-offs.",
            "Tell me about a time you measured product success."
        ],
        "QA Engineer": [
            "Tell me about a time you found a hidden issue.",
            "Describe a situation where you improved testing.",
            "Tell me about a time you handled release pressure.",
            "Describe a situation where you collaborated with developers.",
            "Tell me about a time you ensured quality."
        ],
        "Technical Support Engineer": [
            "Tell me about a time you solved a customer problem.",
            "Describe a situation where you explained a technical issue simply.",
            "Tell me about a time you handled multiple issues.",
            "Describe a situation where you worked under pressure.",
            "Tell me about a time you improved customer satisfaction."
        ],
        "UI Developer": [
            "Tell me about a time you improved user interface experience.",
            "Describe a situation where you handled design constraints.",
            "Tell me about a time you fixed UI bugs.",
            "Describe a situation where you worked with designers.",
            "Tell me about a time you optimized frontend performance."
        ]
    },
    "Swiggy": {
        "Software Engineer": [
            "Tell me about a time you optimized system performance.",
            "Describe a situation where you handled high load scenarios.",
            "Tell me about a time you debugged a production issue.",
            "Describe a situation where you improved an existing system.",
            "Tell me about a time you worked under tight deadlines."
        ],
        "Product Manager": [
            "Tell me about a time you improved customer experience.",
            "Describe a situation where you prioritized features quickly.",
            "Tell me about a time you handled user complaints.",
            "Describe a situation where you made trade-offs.",
            "Tell me about a time you used data to improve a product."
        ],
        "Operations Manager": [
            "Tell me about a time operations didn’t go as planned.",
            "Describe a situation where you improved efficiency.",
            "Tell me about a time you handled peak workload.",
            "Describe a situation where you coordinated teams.",
            "Tell me about a time you ensured timely delivery."
        ],
        "Data Analyst": [
            "Tell me about a time you analyzed customer behavior.",
            "Describe a situation where your insights improved a process.",
            "Tell me about a time you handled large datasets.",
            "Describe a situation where you communicated insights.",
            "Tell me about a time you validated assumptions."
        ],
        "QA Engineer": [
            "Tell me about a time you ensured product quality.",
            "Describe a situation where you found a major issue.",
            "Tell me about a time you improved testing.",
            "Describe a situation where you worked under deadlines.",
            "Tell me about a time you collaborated with developers."
        ]
    },
    "Zomato": {
        "Software Engineer": [
            "Tell me about a time you improved system performance.",
            "Describe a situation where you handled scalability challenges.",
            "Tell me about a time you debugged a complex issue.",
            "Describe a situation where you improved an existing feature.",
            "Tell me about a time you delivered under pressure."
        ],
        "Product Manager": [
            "Tell me about a time you improved user experience.",
            "Describe a situation where you handled conflicting priorities.",
            "Tell me about a time you used data for decisions.",
            "Describe a situation where you made product trade-offs.",
            "Tell me about a time you handled user feedback."
        ],
        "Data Analyst": [
            "Tell me about a time you analyzed user behavior.",
            "Describe a situation where your insights drove change.",
            "Tell me about a time you handled messy data.",
            "Describe a situation where you communicated findings.",
            "Tell me about a time you validated insights."
        ],
        "Operations Executive": [
            "Tell me about a time you handled operational challenges.",
            "Describe a situation where you improved efficiency.",
            "Tell me about a time you worked under pressure.",
            "Describe a situation where you coordinated teams.",
            "Tell me about a time you ensured timely execution."
        ],
        "QA Engineer": [
            "Tell me about a time you ensured product quality.",
            "Describe a situation where you found critical bugs.",
            "Tell me about a time you improved testing processes.",
            "Describe a situation where deadlines were tight.",
            "Tell me about a time you collaborated with developers."
        ]
    },
    "Capgemini": {
        "Software Engineer": [
            "Tell me about a time you solved a technical challenge.",
            "Describe a situation where you worked in a team.",
            "Tell me about a time you learned something quickly.",
            "Describe a situation where you handled deadlines.",
            "Tell me about a time you improved your code."
        ],
        "Business Analyst": [
            "Tell me about a time you gathered requirements.",
            "Describe a situation where you presented ideas.",
            "Tell me about a time you improved a process.",
            "Describe a situation where stakeholders disagreed.",
            "Tell me about a time you used data for decisions."
        ],
        "Consultant": [
            "Tell me about a time you solved a real-world problem.",
            "Describe a situation where you worked under pressure.",
            "Tell me about a time you influenced someone.",
            "Describe a situation where you handled ambiguity.",
            "Tell me about a time you delivered results."
        ],
        "Project Manager": [
            "Tell me about a time you managed a project timeline.",
            "Describe a situation where a project was delayed.",
            "Tell me about a time you handled conflicts.",
            "Describe a situation where priorities changed.",
            "Tell me about a time you ensured delivery."
        ],
        "QA Tester": [
            "Tell me about a time you ensured quality.",
            "Describe a situation where you found issues.",
            "Tell me about a time you improved testing.",
            "Describe a situation where you worked with developers.",
            "Tell me about a time you handled deadlines."
        ]
    }
}

# Add "General HR" Fallback
GENERAL_HR = {
    "General HR": {
        "Standard": [
            "Tell me about yourself and your background.",
            "Why do you want to work for our company?",
            "What is your greatest professional achievement?",
            "Describe a difficult work situation and how you handled it.",
            "Where do you see yourself in five years?"
        ]
    }
}

def seed():
    # Merge datasets
    ALL_DATA = {**RAW_DATA, **GENERAL_HR}
    
    # Use the secure engine from database.py
    from database import engine
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        print(f"Seeding database at: {DATABASE_URL.split('@')[-1]}")
        
        # 🛡️ SAFE MODE: We no longer wipe your personal results!
        # db.query(models.Answer).delete()
        # db.query(models.Session).delete()
        db.query(models.Question).delete()
        
        count = 0
        for company, roles in ALL_DATA.items():
            for role, questions in roles.items():
                for q_text in questions:
                    new_q = models.Question(
                        company=company,
                        role=role,
                        question_text=q_text,
                        rubric=DEFAULT_RUBRIC,
                        model_answer="Candidates should provide a specific situation, the actions they took, and the measurable results or key learnings."
                    )
                    db.add(new_q)
                    count += 1
        
        db.commit()
        print(f"✅ Successfully seeded {count} professional questions! Your database cost: $0.00.")
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
