#!/bin/bash

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Add current user to docker group
sudo usermod -aG docker $USER

# Install git if not installed
sudo apt-get install -y git

# Create directory for the application
APP_DIR="/home/ubuntu/chat-app"
if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p $APP_DIR
fi

# Clone your repository
cd $APP_DIR
git clone https://github.com/SavaidKhanStudent/Chat_App.git .

# Install npm dependencies and build the app
npm install
npm run build

# Build and run the Docker container
sudo docker build -t chat-app .
sudo docker run -d -p 80:80 --name chat-app-container chat-app

# Print success message
echo "Deployment complete!"
echo "Your application is now running at http://YOUR_EC2_IP"
echo "Note: You may need to restart your shell session for Docker group changes to take effect"

# Set up environment variables for Firebase
sudo mkdir -p /etc/chat-app
sudo tee /etc/chat-app/firebase-config.json > /dev/null << EOF
{
  "apiKey": "$FIREBASE_API_KEY",
  "authDomain": "$FIREBASE_AUTH_DOMAIN",
  "projectId": "$FIREBASE_PROJECT_ID",
  "storageBucket": "$FIREBASE_STORAGE_BUCKET",
  "messagingSenderId": "$FIREBASE_MESSAGING_SENDER_ID",
  "appId": "$FIREBASE_APP_ID"
}
EOF

# Set permissions
sudo chown -R ubuntu:ubuntu /etc/chat-app
sudo chmod 644 /etc/chat-app/firebase-config.json
