@echo off
echo Installing LinguaSphere AI...

cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env

cd ..
cd frontend
npm install

echo Installation Complete!
echo Add your API keys to backend/.env and run start.bat
