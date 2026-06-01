#!/bin/bash

image_name=ystu_ep_front1-next-app
container_ids=$(docker ps -a -q --filter ancestor=$image_name)
sudo docker container stop $container_ids
sudo docker container remove $container_ids
sudo docker image remove $image_name
sudo docker compose up -d
