import os
import asyncio
import re
import selectors
from sqlalchemy import text
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

async def async_main() -> None:
    database_url = os.getenv('DATABASE_URL')
    # Convert postgresql:// to postgresql+psycopg: for async
    async_url = re.sub(r'^postgresql:', 'postgresql+psycopg:', database_url)
    
    engine = create_async_engine(async_url, echo=True)
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 'hello world'"))
            print("✅ Connection successful!")
            print(result.fetchall())
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        await engine.dispose()

# Run the async function
if __name__ == "__main__":
    # Windows fix: Use SelectorEventLoop for psycopg3 compatibility
    asyncio.run(async_main(), loop_factory=asyncio.SelectorEventLoop)