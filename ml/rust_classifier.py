import torch
import torch.nn as nn
import torchvision.models as models
from torch.utils.data import Dataset
from PIL import Image
import pandas as pd
import torchvision.transforms as transforms
import os

class RustClassifier(nn.Module):
    def __init__(self):
        super(RustClassifier, self).__init__()

        base_model = models.mobilenet_v2(pretrained=True)
        self.features = base_model.features
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))

        self.fc = nn.Sequential(
            nn.Linear(1280, 512),
            nn.ReLU(),
            nn.Linear(512, 128),
            nn.ReLU(),
            nn.Linear(128, 2)  # 2 sınıf: çözülmedi / çözüldü
        )

    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        return x
    
class RustDataset(Dataset):
    def __init__(self, csv_file, img_dir):
        self.data = pd.read_csv(csv_file)
        self.img_dir = img_dir
        self.transform = transforms.Compose([
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

        label = torch.tensor(self.data.iloc[idx]['pas_cleared'], dtype=torch.long)
        return image, label 
    
def train_model(model, dataloader, criterion, optimizer, device, num_epochs=20):
    model.train()

    for epoch in range(num_epochs):
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in dataloader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

        epoch_loss = running_loss / len(dataloader)
        epoch_acc = correct / total

        print(f"Epoch [{epoch+1}/{num_epochs}] - Loss: {epoch_loss:.4f} - Accuracy: {epoch_acc:.4f}")

    print("Pas sınıflandırma eğitimi tamamlandı.")
    return model

def main_pas():
    csv_file = 'dataset_pas/labels_pas.csv'
    img_dir = 'dataset_pas/images'
    batch_size = 32
    num_epochs = 20
    learning_rate = 0.001
    model_save_path = './rust_classifier_model.pt'

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Cihaz: {device}")

    dataset = RustDataset(csv_file=csv_file, img_dir=img_dir)
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = RustClassifier().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

    model = train_model(model, dataloader, criterion, optimizer, device, num_epochs)

    torch.save(model.state_dict(), model_save_path)
    print(f"Pas modeli {model_save_path} dosyasına kaydedildi.")

if __name__ == "__main__":
    main_pas()