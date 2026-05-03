import json
import math
import re
from collections import defaultdict

# Load the data generated previously
with open("app/src/engines/fasttext-data.json", "r") as f:
    dataset = json.load(f)

def tokenize(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return text.split()

# Build vocabulary and count frequencies
vocab = set()
class_counts = defaultdict(int)
word_counts = defaultdict(lambda: defaultdict(int)) # word_counts[intent][word]
total_docs = 0

for item in dataset:
    intent = item['intent']
    tokens = tokenize(item['text'])
    
    class_counts[intent] += 1
    total_docs += 1
    
    for token in tokens:
        vocab.add(token)
        word_counts[intent][token] += 1

# Calculate probabilities (with Laplace smoothing)
vocab_size = len(vocab)
model = {
    'classes': {},
    'vocab': list(vocab)
}

for intent in class_counts:
    prior = class_counts[intent] / total_docs
    
    # Calculate total words in this class
    total_words_in_class = sum(word_counts[intent].values())
    
    word_probs = {}
    for word in vocab:
        count = word_counts[intent].get(word, 0)
        # Laplace smoothing: (count + 1) / (total_words + vocab_size)
        prob = (count + 1) / (total_words_in_class + vocab_size)
        word_probs[word] = math.log(prob)
        
    model['classes'][intent] = {
        'prior': math.log(prior),
        'word_probs': word_probs
    }

with open("app/src/engines/router_weights.json", "w") as f:
    json.dump(model, f)

print(f"Exported Naive Bayes model with {len(vocab)} vocabulary words and {len(class_counts)} intents to router_weights.json")
