import os
import sys
import json
import pprint
from pyquery import PyQuery
from dotenv import load_dotenv
load_dotenv()
import os
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec



if len(sys.argv) < 4:
    print(f"received link parameter: {sys.argv}")
    file_name = None
    for arg in sys.argv:
        if arg.endswith(".txt"):
            file_name = arg
    if file_name is None:
        file_name = "review_data.txt"

    html = "".join(open(file_name, "r+").readlines())
    pq = PyQuery(html)
    professor = pq(".NameTitle__Name-dowf0z-0").text()
    department = " ".join([r for r in pq("span > a > b").text().split(" ") if r.lower() != "department"])
    reviews = [r.text() for r in pq(".Comments__StyledComments-dzzyvm-0").items()]
    stars = [r.text() for r in pq("div:nth-child(1) > div > .CardNumRating__CardNumRatingNumber-sc-17t4b9u-2").items()]
    data = json.load(open("reviews_updated.json", "r+"))
    # pprint.pprint(data, indent=2)
    curr_data = []
    if len(reviews) != len(stars):
        print("failed to parse reviews")
        sys.exit(1)
    for i in range(len(reviews)):
        review = reviews[i]
        star = stars[i]
        data['reviews'].append({"professor": professor,
                        "review": review,
                        "stars": int(float(star)),
                        "subject": department})
else:
    print(f"received form data parameter: {sys.argv}")
    professor = sys.argv[1]
    subject = sys.argv[2]
    rating = sys.argv[3]
    review = sys.argv[4].replace("\"","")
    data = json.load(open("reviews_updated.json", "r+"))
    # pprint.pprint(data, indent=2)
    data['reviews'].append({"professor": professor,
                    "review": review,
                    "stars": int(float(rating)),
                    "subject": subject})
json.dump(data, open("reviews_updated.json", "w+"), indent=4)

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
# data = json.load(open("reviews_updated.json"))
# data['reviews']
processed_data = []
client = OpenAI() 

for review in data['reviews']:
    response = client.embeddings.create(
        input=review['review'],
        model="text-embedding-3-small",
    )
    embedding = response.data[0].embedding
    processed_data.append({
        "values": embedding,
        "id": review["professor"],
        "metadata": {
            "review": review["review"],
            "subject": review["subject"],
            "stars": review["stars"]
        }
    })
index = pc.Index('rag')
index.upsert(
    vectors=processed_data,
    namespace="ns1"
)
print(index.describe_index_stats())






sys.exit(0)