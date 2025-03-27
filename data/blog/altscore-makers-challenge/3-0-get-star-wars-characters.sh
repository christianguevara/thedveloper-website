#!/bin/bash

url="https://swapi.dev/api/people"

output_file="star_wars_characters_with_homeworld.txt"
> "$output_file"
# Go page by page until apparently get null
while [ -n "$url" ]; do
    response=$(curl -s "$url")
    
    # Get the characters and their homeworld id
    echo "$response" | jq -r '.results[] | 
        (.name + ":" + (.homeworld | split("/")[-2]))' >> "$output_file"
    
    # Get the next page
    url=$(echo "$response" | jq -r '.next') 
    
    # If the next page is null, break the loop
    if [ "$url" = "null" ]; then
        url=""
    fi
    
    sleep 1
done

echo "Character data --> $output_file" 