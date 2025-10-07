# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install node package dependencies

   ```bash
   npm install
   ```

   > package.json 파일의 모든 nodejs 의존성 패키지를 다운로드하는 명령어.

2. install python and its requirements

   > Note - 파이썬 3.10 버전이 설치되어 있어야 합니다. `py -3.10 -m venv [name]` 명령어로 가상 환경을 만들 수 있습니다.

   ```bash
   pip install -r requirements.txt
   ```

3. 환경 변수 설정

   Google Custom Search API를 사용하기 위해 다음 환경 변수를 설정해야 합니다:

   bash
   # Google Custom Search API 설정
   export GOOGLE_SEARCH_API_KEY=your_key
   export GOOGLE_SEARCH_ENGINE_ID=your_ID
   
   # OpenAI API 키 (기존 NLP 기능용)
   export OPENAI_API_KEY=your_key
   
r
   **Google Custom Search API 설정 방법:**
   1. [Google Cloud Console](https://console.cloud.google.com/apis/library/customsearch.googleapis.com)에서 Custom Search API를 활성화
   2. API 키를 발급받아 `GOOGLE_SEARCH_API_KEY`에 설정
   3. [Google Custom Search Engine](https://cse.google.com/cse/all)에서 검색 엔진을 생성
   4. 검색 엔진 ID를 복사하여 `GOOGLE_SEARCH_ENGINE_ID`에 설정

4. Start the backend server
   ```bash
   python app.py
   # 또는
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Start the expo app
   ```sh
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
