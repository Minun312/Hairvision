import io

import torch
import torch.nn.functional as F
import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from torch import nn
from torchvision import models, transforms

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform = transforms.Compose(
    [
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5] * 3, std=[0.5] * 3),
    ]
)

model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Sequential(
    nn.Linear(num_ftrs, 1024), nn.ReLU(), nn.Dropout(0.5), nn.Linear(1024, 5)
)
model.load_state_dict(torch.load("model.pth", map_location=device))
model = model.to(device)
model.eval()

class_names = ["Straight", "Wavy", "Curly", "Dreadlocks", "Kinky"]


@app.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    img_bytes = await file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = F.softmax(outputs, dim=1)
        probabilities = probabilities.cpu().numpy()[0]

        probabilities_dict = {
            class_names[i]: float(round(prob, 4))
            for i, prob in enumerate(probabilities)
        }

    return JSONResponse(content=probabilities_dict)


uvicorn.run(app, port=5000)
