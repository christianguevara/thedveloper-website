#!/bin/bash

url="https://swapi.dev/api/people"

output_file="star_wars_characters.txt"
> "$output_file"
# Go page by page until apparently get null
#TODO: test if null is right
while [ -n "$url" ]; do
    response=$(curl -s "$url")
    
    echo "$response" | jq -r '.results[] | 
        (.name + ":" + (.homeworld | split("/")[-2]))' >> "$output_file"
    
    url=$(echo "$response" | jq -r '.next')
    
    if [ "$url" = "null" ]; then
        url=""
    fi
    
    sleep 1
done

echo "Character data --> $output_file" 