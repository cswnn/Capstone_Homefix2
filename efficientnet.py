
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.transforms import InterpolationMode
from PIL import Image
from efficientnet_pytorch import EfficientNet

# ------------------------- 모델 정의 ------------------------- #
class EfficientNetModel(nn.Module):
    def __init__(self, num_labels, num_locations, model_name='efficientnet-b5'):
        super().__init__()
        self.backbone = EfficientNet.from_name(model_name)
        self.backbone._fc = nn.Identity()  # 기존 분류기 제거

        feature_dim = self.backbone._conv_head.out_channels
        self.pooling = nn.AdaptiveAvgPool2d(1)

        self.label_head = nn.Sequential(
            nn.Linear(feature_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_labels)
        )

        self.loc_head = nn.Sequential(
            nn.Linear(feature_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_locations)
        )

    def forward(self, x):
        features = self.backbone.extract_features(x)
        pooled = self.pooling(features).flatten(start_dim=1)
        label_out = self.label_head(pooled)
        loc_out = self.loc_head(pooled)
        return label_out, loc_out


# ------------------------- 설정 ------------------------- #
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

location_map = {
    '가구': 0, '가스레인지': 1, '냄비/후라이팬': 2, '배관류': 3, '부품': 4,
    '세탁기': 5, '수전': 6, '스테인리스': 7, '식기류': 8, '싱크대': 9,
    '에어컨': 10, '에어프라이어': 11, '오븐': 12, '욕실액세서리': 13, '유리': 14,
    '인덕션': 15, '전자레인지': 16, '종이벽지': 17, '창틀/문틀': 18,
    '타일/페인트벽': 19, '프레임': 20, '후드': 21
}
inv_location_map = {v: k for k, v in location_map.items()}
problems = ['기름때', '곰팡이', '녹', '물때']

valid_location_scope = {
    0: [1, 2, 8, 9, 11, 12, 15, 16, 17, 19, 21],  # grease
    1: [5, 10, 17, 18, 19],  # mold
    2: [0, 1, 3, 4, 6, 13, 20],  # rust
    3: [6, 7, 14]  # water_stain
}

transform = transforms.Compose([
    transforms.Resize((456, 456), interpolation=InterpolationMode.BILINEAR),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


# ------------------------- 모델 로딩 ------------------------- #
def load_model(weight_path='best_model.pt'):
    model = EfficientNetModel(num_labels=4, num_locations=len(location_map))
    model.load_state_dict(torch.load(weight_path, map_location=device))
    model.to(device)
    model.eval()
    return model


# ------------------------- 예측 함수 ------------------------- #
def predict_image(model, image_path_or_pil):
    if isinstance(image_path_or_pil, str):
        image = Image.open(image_path_or_pil).convert('RGB')
    else:
        image = image_path_or_pil.convert('RGB')

    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        label_out, loc_out = model(image)

        pred_label_idx = torch.argmax(label_out, dim=1).item()

        # 유효 위치 마스킹
        valid_indices = valid_location_scope[pred_label_idx]
        masked_loc_out = torch.full_like(loc_out, -1e9)
        masked_loc_out[:, valid_indices] = loc_out[:, valid_indices]
        pred_loc_idx = torch.argmax(masked_loc_out, dim=1).item()

    return pred_label_idx, pred_loc_idx


# ------------------------- 파이프라인 함수 ------------------------- #
def run_pipeline(image_path_or_pil, model=None):
    if model is None:
        model = load_model()

    pred_label, pred_loc = predict_image(model, image_path_or_pil)

    pred_label_name = problems[pred_label]
    pred_loc_name = inv_location_map[pred_loc]

    return pred_label_name, pred_loc_name

