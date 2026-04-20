from flask import Flask, request, jsonify
from flask_cors import CORS
import google.genai as genai
import os
from datetime import datetime
import json
import re
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:8002", "http://localhost:5173", "http://127.0.0.1:8002", "http://127.0.0.1:5173"])

# Configure Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    print("Gemini API key detected. AI ranking will use Gemini.")
else:
    print("Warning: GEMINI_API_KEY not set. AI ranking will use fallback.")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "AI Ranking Service",
        "gemini_configured": bool(GEMINI_API_KEY)
    })

@app.route('/rank-proposals', methods=['POST', 'OPTIONS'])
def rank_proposals():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response

    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        task = data.get('task')
        proposals = data.get('proposals')
        vendors_data = data.get('vendorsData', {})

        if not task:
            return jsonify({"error": "Missing task data"}), 400
        if not proposals:
            return jsonify({"error": "Missing proposals data"}), 400

        ranked_proposals = rank_with_gemini(task, proposals, vendors_data)

        return jsonify({
            "success": True,
            "ranked_proposals": ranked_proposals
        })

    except Exception as e:
        print(f"Error in ranking: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": str(e),
            "details": "Check Python service logs for more information"
        }), 500

def rank_with_gemini(task, proposals, vendors_data):
    try:
        prompt = create_skill_based_ranking_prompt(task, proposals, vendors_data)

        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)

        try:
            response_text = response.text

            if '```json' in response_text:
                json_str = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                json_str = response_text.split('```')[1].split('```')[0].strip()
            else:
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx >= 0 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                else:
                    json_str = response_text.strip()

            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)

            ranked_data = json.loads(json_str)

            ranked_proposals = []
            proposal_map = {}
            for p in proposals:
                p_id = str(p.get('_id'))
                proposal_map[p_id] = p

            for item in ranked_data.get('rankings', []):
                proposal_id = str(item.get('proposal_id'))
                if proposal_id in proposal_map:
                    ranked_proposal = proposal_map[proposal_id].copy()
                    ranked_proposal['aiRank'] = item.get('rank')
                    ranked_proposal['aiScore'] = item.get('score')
                    ranked_proposal['aiReasoning'] = item.get('reasoning', '')
                    ranked_proposal['aiBreakdown'] = item.get('breakdown', {})
                    ranked_proposals.append(ranked_proposal)

            ranked_proposals.sort(key=lambda x: x.get('aiRank', 999))
            return ranked_proposals

        except Exception as e:
            print(f"Error parsing Gemini response: {str(e)}")
            return skill_based_fallback_ranking(proposals, vendors_data, task)

    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        return skill_based_fallback_ranking(proposals, vendors_data, task)

def skill_based_fallback_ranking(proposals, vendors_data, task):
    scored_proposals = []

    task_requirements = task.get('requirements', '').lower()
    task_description = task.get('description', '').lower()
    task_text = task_requirements + " " + task_description

    common_skills = [
        'react', 'node', 'python', 'java', 'javascript', 'html', 'css',
        'mongodb', 'sql', 'mysql', 'postgresql', 'aws', 'azure', 'docker',
        'kubernetes', 'devops', 'frontend', 'backend', 'fullstack',
        'mobile', 'ios', 'android', 'flutter', 'react native',
        'ui/ux', 'design', 'figma', 'photoshop', 'illustrator',
        'wordpress', 'shopify', 'woocommerce', 'php', 'laravel',
        'vue', 'angular', 'typescript', 'next.js', 'express',
        'django', 'flask', 'spring', 'c#', '.net', 'go', 'rust'
    ]

    for proposal in proposals:
        vendor = proposal.get('vendorId', {})
        if isinstance(vendor, dict):
            vendor_id = vendor.get('_id')
        else:
            vendor_id = str(vendor) if vendor else None
        vendor_info = vendors_data.get(str(vendor_id), {}) if vendor_id else {}

        # 1. SKILLS SCORE (35 points)
        proposal_skills = [s.lower() for s in proposal.get('skills', [])]
        matching_skills = []
        for skill in proposal_skills:
            if skill in task_text:
                matching_skills.append(skill)
            for common in common_skills:
                if common in skill or skill in common:
                    if common in task_text:
                        matching_skills.append(skill)
                        break
        unique_matches = list(set(matching_skills))

        if len(unique_matches) >= 4:
            skills_score = 35
        elif len(unique_matches) == 3:
            skills_score = 30
        elif len(unique_matches) == 2:
            skills_score = 25
        elif len(unique_matches) == 1:
            skills_score = 15
        else:
            skills_score = 5

        # 2. EXPERIENCE SCORE (30 points)
        total_projects = vendor_info.get('totalProjects', 0)
        completed_projects = vendor_info.get('completedProjects', 0)
        on_time = vendor_info.get('onTimeCompletion', 0)
        relevant_exp = vendor_info.get('relevantExperience', 0)

        if total_projects == 0:
            experience_score = 0
        else:
            if total_projects > 20: exp_base = 20
            elif total_projects > 10: exp_base = 15
            elif total_projects > 5: exp_base = 10
            elif total_projects > 2: exp_base = 5
            else: exp_base = 3

            if relevant_exp > 5: exp_base += 7
            elif relevant_exp > 2: exp_base += 5
            elif relevant_exp > 0: exp_base += 3

            if on_time > 90: exp_base += 3
            elif on_time > 75: exp_base += 2

            experience_score = min(30, exp_base)

        # 3. RELIABILITY SCORE (20 points)
        avg_rating = vendor_info.get('averageRating', 0)
        if avg_rating >= 4.5: reliability_score = 20
        elif avg_rating >= 4.0: reliability_score = 15
        elif avg_rating >= 3.5: reliability_score = 10
        elif avg_rating > 0: reliability_score = 5
        else: reliability_score = 0

        # 4. TIMELINE SCORE (10 points)
        if on_time > 90: timeline_score = 10
        elif on_time > 75: timeline_score = 8
        elif on_time > 50: timeline_score = 6
        elif total_projects > 0: timeline_score = 4
        else: timeline_score = 2

        # 5. BID SCORE (5 points)
        task_budget = task.get('budget', 0)
        bid_amount = proposal.get('bidAmount', 0)
        if task_budget > 0:
            if bid_amount < task_budget * 0.3: bid_score = 1
            elif bid_amount <= task_budget * 1.2: bid_score = 5
            elif bid_amount <= task_budget * 1.5: bid_score = 3
            else: bid_score = 2
        else:
            bid_score = 3

        total_score = skills_score + experience_score + reliability_score + timeline_score + bid_score

        # Generate reasoning
        if skills_score >= 30 and experience_score >= 20:
            reasoning = f"EXCELLENT MATCH: Has {len(unique_matches)} relevant skills ({', '.join(unique_matches[:3])}) with {completed_projects} completed projects and {relevant_exp} relevant to this category. {on_time}% on-time delivery rate."
        elif skills_score >= 20 and experience_score >= 10:
            reasoning = f"GOOD CANDIDATE: Has relevant skills ({', '.join(unique_matches[:2])}) and {completed_projects} projects experience. On-time rate: {on_time}%."
        elif skills_score >= 10:
            reasoning = f"POTENTIAL CANDIDATE: Has some matching skills but limited experience ({completed_projects} projects). Consider interviewing."
        else:
            reasoning = f"RISKY CHOICE: No matching skills found and limited experience. Low bid doesn't guarantee quality."

        if relevant_exp > 0:
            reasoning += f" Has {relevant_exp} relevant projects in this category."

        proposal_copy = proposal.copy()
        proposal_copy['aiScore'] = total_score
        proposal_copy['aiReasoning'] = reasoning
        proposal_copy['aiBreakdown'] = {
            'skills_score': skills_score,
            'experience_score': experience_score,
            'reliability_score': reliability_score,
            'timeline_score': timeline_score,
            'bid_score': bid_score
        }
        scored_proposals.append(proposal_copy)

    scored_proposals.sort(key=lambda x: x['aiScore'], reverse=True)
    for i, prop in enumerate(scored_proposals):
        prop['aiRank'] = i + 1

    return scored_proposals

def create_skill_based_ranking_prompt(task, proposals, vendors_data):
    task_details = f"""
TASK DETAILS:
- Title: {task.get('title', 'N/A')}
- Description: {task.get('description', 'N/A')}
- Requirements: {task.get('requirements', 'N/A')}
- Budget: Rs. {task.get('budget', 0):,}
- Deadline: {task.get('deadline', 'N/A')}
- Category: {task.get('category', 'N/A')}
    """

    proposals_text = "PROPOSALS:\n"
    for i, p in enumerate(proposals):
        vendor = p.get('vendorId', {})
        if isinstance(vendor, dict):
            vendor_id = vendor.get('_id')
            vendor_name = vendor.get('companyName') or vendor.get('username') or 'Unknown'
        else:
            vendor_id = str(vendor) if vendor else None
            vendor_name = 'Unknown'
        vendor_info = vendors_data.get(str(vendor_id), {}) if vendor_id else {}

        total_projects = vendor_info.get('totalProjects', 0)
        completed_projects = vendor_info.get('completedProjects', 0)
        on_time = vendor_info.get('onTimeCompletion', 0)
        avg_rating = vendor_info.get('averageRating', 0)
        relevant_exp = vendor_info.get('relevantExperience', 0)

        skills = p.get('skills', [])
        skills_text = ', '.join(skills[:5]) + (f' and {len(skills)-5} more' if len(skills) > 5 else '')

        proposals_text += f"""
Proposal {i+1} (ID: {p.get('_id')}):
VENDOR: {vendor_name}
VENDOR HISTORY:
- Total Projects: {total_projects}
- Completed Projects: {completed_projects}
- On-Time Delivery: {on_time}%
- Average Rating: {avg_rating}/5
- Relevant Experience (same category): {relevant_exp} projects
PROPOSAL DETAILS:
- Bid: Rs. {p.get('bidAmount', 0):,}
- Deadline: {p.get('proposedDeadline', 'N/A')}
- Skills: {skills_text}
- Proposal Text: {p.get('proposalText', '')[:300]}...
"""

    prompt = f"""
You are an EXPERT PROPOSAL EVALUATOR. Rank these proposals based on SKILLS and EXPERIENCE, NOT on price.

CRITICAL RULES:
- A vendor with RELEVANT SKILLS and EXPERIENCE should rank HIGH even if their bid is HIGHER
- A vendor with NO SKILLS or EXPERIENCE should rank LOW even if their bid is VERY LOW
- NEVER rank based on price alone

{task_details}

{proposals_text}

Return a JSON object with rankings from BEST to WORST:

{{
  "rankings": [
    {{
      "proposal_id": "id_here",
      "rank": 1,
      "score": 95,
      "reasoning": "Excellent skills match and proven experience in similar projects"
    }}
  ]
}}

Only return valid JSON.
"""
    return prompt

@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        "status": "ok",
        "message": "AI Ranking Service is running",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting AI Ranking Service...")
    print("Server will run on http://0.0.0.0:5001")
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
