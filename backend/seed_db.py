import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

# Import engine and Base from database.py to ensure SSL and schema are correct
from database import engine, Base, DATABASE_URL

# Standard Grading Rubric for Behavioral/Situational Questions
DEFAULT_RUBRIC = [
    {"point": "Situation/Task Clarity: How clearly was the context described?", "points": 10},
    {"point": "Action Detail: Did the candidate explain THEIR specific actions?", "points": 10},
    {"point": "Result/Impact: Was a clear outcome or learning provided?", "points": 10},
    {"point": "Communication & Tone: Was the response professional and structured?", "points": 10}
]

# The Massive Curated Dataset
RAW_DATA = {
    "Google": {
        "Product Manager": [
            "Tell me about a time you identified a user problem that others overlooked. What specific steps did you take to validate it?",
            "Describe a situation where you had multiple feature requests but limited time. How did you decide what to prioritize?",
            "Tell me about a time your product idea didn’t work as expected. What did you learn and how did you pivot?",
            "Describe a situation where engineers disagreed with your product approach. How did you handle the conflict?",
            "Tell me about a time you had to take a major product decision without complete data. What was your reasoning?"
        ],
        "Data Analyst": [
            "Tell me about a time your data analysis changed a major business decision. What resistance did you face?",
            "Describe a situation where your data was incomplete or inconsistent. How did you still derive actionable insights?",
            "Tell me about a time you found an error in your own analysis after presenting it. How did you handle the situation?",
            "Describe a situation where stakeholders didn’t understand your technical insights. How did you bridge the communication gap?",
            "Tell me about a time you used data to question a deep-seated assumption. What was the outcome?"
        ],
        "UX Designer": [
            "Tell me about a time users struggled with a flow you designed. How did you identify the friction and fix it?",
            "Describe a situation where you had to balance critical user needs against significant technical limitations.",
            "Tell me about a time your design was rejected by stakeholders. How did you handle the feedback?",
            "Describe a situation where you had to redesign a core component quickly based on urgent user feedback.",
            "Tell me about a time you simplified a complex user flow. What was your specific architectural approach?"
        ],
        "Site Reliability Engineer": [
            "Tell me about a time a system or project failed unexpectedly in production. How did you respond and recover?",
            "Describe a situation where you had to debug an issue with very little information or logs.",
            "Tell me about a time you identified and prevented a potential system failure before it actually happened.",
            "Describe a situation where you had to choose between a quick 'band-aid' fix vs a long-term architectural solution.",
            "Tell me about a time you automated a significant repetitive process. What was the measurable impact?"
        ],
        "Technical Program Manager": [
            "Tell me about a time you had to manage multiple stakeholders with conflicting priorities across teams.",
            "Describe a situation where your project was falling behind schedule. What specific actions did you take to recover?",
            "Tell me about a time you led a complex project without having formal authority over the team members.",
            "Describe a situation where communication gaps caused a project delay. How did you resolve the bottleneck?",
            "Tell me about a time you handled extreme ambiguity in a high-stakes project."
        ]
    },
    "Amazon": {
        "Software Development Engineer": [
            "Tell me about a time you took ownership of a critical problem that wasn’t explicitly assigned to you.",
            "Describe a situation where you had to deliver a feature under a tight deadline. What technical trade-offs did you make?",
            "Tell me about a time you failed to meet a goal. How did you handle the failure and what changed afterward?",
            "Describe a situation where you disagreed with your team’s technical approach. How did you present your case?",
            "Tell me about a time you improved a system's performance or reliability without being asked."
        ],
        "Product Manager": [
            "Tell me about a time you prioritized long-term customer needs over short-term technical convenience.",
            "Describe a situation where you had conflicting stakeholder inputs. How did you reach a resolution?",
            "Tell me about a time you had to launch a product quickly with very limited resources.",
            "Describe a situation where customer feedback forced you to completely rethink your product approach.",
            "Tell me about a time you made a decision that impacted millions of users. What was your framework?"
        ],
        "Business Analyst": [
            "Tell me about a time your analysis identified a business problem that senior leadership had missed.",
            "Describe a situation where your analytical recommendation was challenged by a non-technical manager.",
            "Tell me about a time you worked with unclear requirements to deliver a critical report.",
            "Describe a situation where your data-driven insights led to a measurable business improvement.",
            "Tell me about a time you had to convince a skeptical audience using only data."
        ],
        "Operations Manager": [
            "Tell me about a time things went wrong during a high-stakes execution. How did you recover the operation?",
            "Describe a situation where you improved a significantly inefficient process using lean methodologies.",
            "Tell me about a time you handled extreme pressure or a peak workload event (like Prime Day).",
            "Describe a situation where you had to manage a direct conflict within your operational team.",
            "Tell me about a time you ensured tight deadlines were met despite significant resource challenges."
        ],
        "QA Engineer": [
            "Tell me about a time you found a critical edge-case bug that others had overlooked during testing.",
            "Describe a situation where release pressure conflicted with quality standards. How did you handle it?",
            "Tell me about a time you significantly improved an existing automated testing process.",
            "Describe a situation where developers disagreed with your bug report. How did you prove the impact?",
            "Tell me about a time you ensured high product quality despite having very limited time for testing."
        ]
    },
    "Microsoft": {
        "Software Engineer": [
            "Tell me about a time you collaborated with a cross-functional team to solve a complex bug.",
            "Describe a situation where you had to quickly adapt to a major change in technology or project scope.",
            "Tell me about a time you received difficult constructive criticism. What specific actions did you take?",
            "Describe a situation where you went out of your way to help a teammate succeed.",
            "Tell me about a time you handled a challenging production issue under stress."
        ],
        "Product Manager": [
            "Tell me about a time you aligned different engineering teams toward a common long-term goal.",
            "Describe a situation where you had to balance immediate user needs with long-term business strategy.",
            "Tell me about a time your product decision was questioned by leadership. How did you defend it?",
            "Describe a situation where you had to pivot your product plan due to market changes.",
            "Tell me about a time you drove significant impact through a single data-informed product decision."
        ],
        "Data Scientist": [
            "Tell me about a time your predictive model didn’t perform as expected in the real world. Why?",
            "Describe a situation where you had to explain highly complex mathematical results to a simple audience.",
            "Tell me about a time you handled extremely messy or biased data to find the truth.",
            "Describe a situation where your statistical insights directly influenced a product feature.",
            "Tell me about a time you rigorously validated or rejected a common business hypothesis."
        ]
    },
    "Adobe": {
        "Software Engineer": [
            "Tell me about a time you had to debug a performance issue that was blocking an entire release.",
            "Describe a situation where you chose to improve an existing legacy feature rather than building something new.",
            "Tell me about a time you had to work closely with UI/UX designers and had a difference of opinion.",
            "Describe a situation where your code caused a production regression. How did you handle it?",
            "Tell me about a time you had to balance speed of delivery with maintaining high code quality."
        ]
    },
    "Meta": {
        "Software Engineer": [
            "Tell me about a time you had to 'move fast' but still maintain technical excellence.",
            "Describe a situation where you handled a significant performance bottleneck in a high-traffic app.",
            "Tell me about a time your architecture didn’t scale as expected. What did you change?",
            "Describe a situation where you had to quickly fix a critical production issue impacting millions.",
            "Tell me about a time you worked in a highly collaborative and fast-paced environment."
        ]
    },
    "Netflix": {
        "Software Engineer": [
            "Tell me about a time you owned a major system or feature from inception to production.",
            "Describe a situation where you drastically improved system performance or reduced latency.",
            "Tell me about a time you handled a critical production failure independently.",
            "Describe a situation where you made a difficult trade-off between absolute reliability and delivery speed.",
            "Tell me about a time you made a high-impact decision without seeking consensus from leadership."
        ]
    },
    "Flipkart": {
        "Software Engineer": [
            "Tell me about a time you optimized system performance to handle a massive surge in traffic (e.g., Big Billion Days).",
            "Describe a situation where your code had to handle extreme scale challenges.",
            "Tell me about a time you debugged a complex distributed systems issue.",
            "Describe a situation where you worked under an extremely tight deadline to launch a feature.",
            "Tell me about a time you significantly improved an existing legacy system."
        ]
    },
    "Accenture": {
        "Associate Software Engineer": [
            "Tell me about a time you learned a new technology or framework very quickly for a client project.",
            "Describe a situation where you worked in a high-performing team under strict deadlines.",
            "Tell me about a time you faced a difficult technical challenge and how you sought help.",
            "Describe a situation where you had to communicate a complex solution clearly to a non-technical peer.",
            "Tell me about a time you adapted to rapidly changing project requirements."
        ]
    },
    "Wipro": {
        "Project Engineer": [
            "Tell me about a time you worked in a team with very tight delivery deadlines.",
            "Describe a situation where you had to learn a new tool or technology almost overnight.",
            "Tell me about a time you faced a persistent technical issue and finally solved it.",
            "Describe a situation where clear communication helped you resolve a major team misunderstanding.",
            "Tell me about a time you took full responsibility for a task that was failing."
        ]
    },
    "Zoho": {
        "Software Developer": [
            "Tell me about a time you built a tool or a feature from scratch with no prior documentation.",
            "Describe a situation where you optimized the backend performance of a data-heavy application.",
            "Tell me about a time you solved a complex technical problem using a creative, out-of-the-box approach.",
            "Describe a situation where you improved the logic or architecture of an existing system.",
            "Tell me about a time you worked independently on a high-stakes project from start to finish."
        ]
    },
    "Swiggy": {
        "Software Engineer": [
            "Tell me about a time you optimized a real-time system's performance to reduce latency.",
            "Describe a situation where you handled extreme high-load scenarios during a peak event.",
            "Tell me about a time you debugged a mission-critical production issue during peak hours.",
            "Describe a situation where you improved an existing logistics or ordering system.",
            "Tell me about a time you worked under extreme pressure to meet a delivery deadline."
        ]
    },
    "Zomato": {
        "Software Engineer": [
            "Tell me about a time you improved a system's performance to handle millions of concurrent users.",
            "Describe a situation where you handled significant scalability challenges in a microservices architecture.",
            "Tell me about a time you debugged a complex issue that spanned multiple services.",
            "Describe a situation where you improved an existing feature to enhance user experience.",
            "Tell me about a time you delivered a high-quality feature under intense pressure."
        ]
    },
    "Capgemini": {
        "Software Engineer": [
            "Tell me about a time you solved a technical challenge that was causing a project delay.",
            "Describe a situation where you worked in a global team to deliver a project.",
            "Tell me about a time you learned a new industry-specific domain quickly.",
            "Describe a situation where you handled tight deadlines for a critical client delivery.",
            "Tell me about a time you improved the maintainability of your team's code."
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
        
        # Clear existing data to prevent foreign key errors
        # (Must delete Answers and Sessions before Questions)
        # 🛡️ SAFE MODE: We no longer wipe your personal results!
        # Only cleanup once if you truly want to reset the whole system.
        # print("Cleaning up old test data...")
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
