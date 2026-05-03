import json
import random

intents = {
    'knowledge_weather': [
        "what's the weather like", "is it raining", "temperature outside",
        "do I need an umbrella", "weather forecast for tomorrow", "how hot is it",
        "current weather in Tokyo", "will it snow", "weather"
    ],
    'knowledge_country': [
        "tell me about France", "capital of Japan", "population of Brazil",
        "what language is spoken in Spain", "where is Kenya", "country info for Canada"
    ],
    'knowledge_book': [
        "who wrote harry potter", "books by brandon sanderson", "when was 1984 published",
        "summary of the hobbit", "find a book called dune", "author of lord of the rings"
    ],
    'knowledge_paper': [
        "academic papers on quantum computing", "research about climate change",
        "find a scientific paper on neural networks", "who authored attention is all you need"
    ],
    'knowledge_dictionary': [
        "define ephemeral", "what does serendipity mean", "meaning of ubiquitous",
        "definition of pragmatic", "how to pronounce antidisestablishmentarianism"
    ],
    'knowledge_currency': [
        "convert 50 USD to EUR", "how much is 100 yen in dollars", "exchange rate for GBP to INR",
        "currency conversion for CAD to AUD", "what's the dollar worth today"
    ],
    'knowledge_holiday': [
        "when is thanksgiving", "is today a public holiday", "when is christmas in 2026",
        "holidays in the US next month", "when is independence day"
    ],
    'knowledge_general': [
        "who is the president of the US", "how far is the moon", "when did WW2 end",
        "who invented the telephone", "what is the speed of light", "tell me a fact"
    ],
    'calendar_query': [
        "what's on my calendar today", "do I have any meetings tomorrow",
        "check my schedule for friday", "what is my next event", "calendar for next week"
    ],
    'calendar_create': [
        "schedule a meeting with John at 3pm", "create an event for doctor appointment tomorrow",
        "add lunch with mom to my calendar for Sunday 1pm", "book a slot for gym at 6am"
    ],
    'contact_lookup': [
        "what is John's phone number", "find email for Sarah", "get contact info for mom",
        "do I have a contact named Michael", "look up David's address"
    ],
    'reminder_create': [
        "remind me to buy milk in 10 minutes", "set a reminder to call dad at 5pm",
        "remind me tomorrow morning to check emails", "create a reminder for laundry"
    ],
    'reminder_list': [
        "what are my reminders", "show me my pending reminders", "do I have any reminders set",
        "list my active reminders"
    ],
    'memory_query': [
        "what is my sister's name", "do you remember my favorite food", "what did I tell you about my dog",
        "where do I live", "what is my wifi password"
    ],
    'memory_forget': [
        "forget that my favorite color is red", "erase the memory about my dog",
        "delete the fact that I live in New York", "forget what I said yesterday"
    ],
    'clipboard_read': [
        "what's on my clipboard", "paste the clipboard text", "read my clipboard",
        "show me what I copied"
    ],
    'clipboard_write': [
        "copy this to clipboard", "save that text to my clipboard", "put 'hello' on my clipboard",
        "copy the summary"
    ],
    'tts_speak': [
        "read this out loud", "speak the last message", "use text to speech for this",
        "say this to me"
    ],
    'time_query': [
        "what time is it", "current time", "what's the time", "tell me the time"
    ],
    'battery_query': [
        "what's my battery level", "how much battery do I have left", "is my phone dying",
        "battery percentage"
    ],
    'device_query': [
        "what device is this", "is this an iphone or android", "what os am I running",
        "device specs"
    ],
    'identity_query': [
        "who are you", "what is your name", "who made you", "are you an ai", "what are you"
    ],
    'limitations_query': [
        "what can you do", "what are your limits", "can you see pictures",
        "do you have internet access", "what are your capabilities"
    ],
    'math_query': [
        "what is 5 plus 5", "calculate 20 percent of 50", "sqrt of 144",
        "how much is 100 divided by 3", "do this math for me"
    ],
    'chat': [
        "hello", "hi there", "how are you", "good morning", "thanks", "okay",
        "that's cool", "I'm feeling sad today", "let's talk", "tell me a joke",
        "I just watched a great movie", "yeah exactly", "no problem"
    ]
}

# Generate 50+ variations by adding filler words
fillers = ["", "can you tell me", "I want to know", "please", "hey lyla", "just wondering"]

dataset = []
for intent, examples in intents.items():
    for ex in examples:
        dataset.append({"text": ex, "intent": intent})
        for f in fillers:
            if f:
                if random.random() > 0.5:
                    dataset.append({"text": f"{f} {ex}", "intent": intent})
                else:
                    dataset.append({"text": f"{ex} {f}", "intent": intent})

with open("app/src/engines/fasttext-data.json", "w") as f:
    json.dump(dataset, f, indent=2)

print(f"Generated {len(dataset)} examples")
