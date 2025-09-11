#!/bin/bash
git clone -v https://github.com/Doty1154/gomuks ~/gomuks
mkdir -pv ~/.config/systemd/user
cp -v ~/gomuks/service-setup/gomuks-web@.service ~/.config/systemd/user
cp -v ~/gomuks/service-setup/gomuks-update.service ~/.config/systemd/user
systemctl --user daemon-reload
systemctl --user enable gomuks-update.service --now
mkdir -pv ~/gomuksdata
cd ~/gomuks
echo "You'll want to launch gomuks with a instance path to setup the config file. Paste the following into the terminal changing the INSTANCENAME to your homeserver"
echo "GOMUKS_ROOT=~/gomuksdata/MYINSTANCENAME ~/gomuks/gomuks"
echo "For example I have mine setup with GOMUKS_ROOT=~/gomuksdata/catboyindustries.co ~/gomuks/gomuks"
echo "You'll be prompted to create a username and password for the specific gomuks service, this isn't your element/matrix login. You can make it something simple and/or without a password"
echo "After entering this gomuks will launch, make sure to hit CTL+C and proceed after gomuks launchs"
echo "If you have multiple gomuks services running you'll need to modify the config file to ensure the port doesn't conflict, increment it by one etc.."
echo "Config should be at ~/gomuksdata/MYINSTANCENAME/config/config.yaml"
echo "Lastly you'll want to launch/enable the service"
echo "systemctl --user enable gomuks-web@MYINSTANCENAME.service --now"
echo "You should be able to access the webservice now at http://localhost:29325/"
echo "You can view the build process with the command"
echo "journalctl --user-unit=gomuks-update.service"
echo "You can view the gomuks web service with the command"
echo "journalctl --user-unit=gomuks-web@MYINSTANCENAME.service"