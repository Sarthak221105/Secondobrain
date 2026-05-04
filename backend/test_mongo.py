import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from backend.services.waitlist import WaitlistStore, WaitlistEntry
from backend.config import get_settings

async def main():
    settings = get_settings()
    print("MongoDB URI configured:", bool(settings.mongodb_uri))
    
    store = WaitlistStore()
    
    # 1. Test storing a new entry
    print("\n--- Testing Add ---")
    entry = WaitlistEntry(
        name="Test User",
        email=f"test_{datetime.now().timestamp()}@example.com",
        company="Test Corp",
        role="Tester",
        use_case="Testing MongoDB integration"
    )
    
    try:
        saved = await store.add(entry)
        print("Successfully added entry:")
        print(saved)
    except Exception as e:
        print("Failed to add entry:", e)
        return
        
    # 2. Test reading all entries
    print("\n--- Testing Read ---")
    try:
        all_entries = await store.all()
        print(f"Total entries found: {len(all_entries)}")
        if all_entries:
            print("Most recent entry:")
            print(all_entries[0])
    except Exception as e:
        print("Failed to read entries:", e)

if __name__ == "__main__":
    asyncio.run(main())
