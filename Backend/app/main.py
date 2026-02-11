from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.startup import run_startup_checks


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_startup_checks()
    yield


app = FastAPI(title="Meta Prompt Generator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
