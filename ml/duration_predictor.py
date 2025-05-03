import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import torchvision.models as models
import pandas as pd
from PIL import Image
import os

# ================================
# DATASET CLASS
# ================================

class DurationDataset(Dataset):
    def __init__(self, csv_file, img_dir):
        self.data = pd.read_csv(csv_file)
        self.img_dir = img_dir
        self.transform = transforms.Compose([
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        img_path = os.path.join(self.img_dir, self.data.iloc[idx]['image_name'])
        image = Image.open(img_path).convert('RGB')
        image = self.transform(image)

        duration = torch.tensor(self.data.iloc[idx]['duration'], dtype=torch.float32)
        return image, duration

# ================================
# MODEL CLASS
# ================================

class DurationPredictorCNN(nn.Module):
    def __init__(self):
        super(DurationPredictorCNN, self).__init__()
        base_model = models.mobilenet_v2(pretrained=True)
        self.features = base_model.features
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.regressor = nn.Sequential(
            nn.Linear(1280, 512),
            nn.ReLU(),
            nn.Linear(512, 128),
            nn.ReLU(),
            nn.Linear(128, 1)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.regressor(x)
        return x

# ================================
# EĞİTİM FONKSİYONU
# ================================

def train_model(model, dataloader, criterion, optimizer, device, num_epochs=20):
    model.train()

    for epoch in range(num_epochs):
        running_loss = 0.0

        for images, durations in dataloader:
            images = images.to(device)
            durations = durations.unsqueeze(1).to(device)  # (batch_size, 1)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, durations)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        avg_loss = running_loss / len(dataloader)
        print(f"Epoch [{epoch+1}/{num_epochs}] - Loss: {avg_loss:.4f}")

    print("Eğitim tamamlandı.")
    return model

# ================================
# ANA PROGRAM
# ================================

def main():
    # Ayarlar
    csv_file = 'dataset/labels.csv'
    img_dir = 'dataset/images'
    batch_size = 32
    num_epochs = 20
    learning_rate = 0.001
    model_save_path = './duration_predictor_model.pt'

    # Cihaz seçimi
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Cihaz: {device}")

    # Dataset & Dataloader
    dataset = DurationDataset(csv_file=csv_file, img_dir=img_dir)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # Model, loss, optimizer
    model = DurationPredictorCNN().to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    # Eğit
    model = train_model(model, dataloader, criterion, optimizer, device, num_epochs)

    # Modeli kaydet
    torch.save(model.state_dict(), model_save_path)
    print(f"Model {model_save_path} dosyasına kaydedildi.")

if __name__ == "__main__":
    main()