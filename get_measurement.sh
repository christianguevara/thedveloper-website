while true; do
    response=$(curl -s -X 'GET' \
      'https://makers-challenge.altscore.ai/v1/s1/e1/resources/measurement' \
      -H 'accept: application/json' \
      -H 'API-KEY: 67fabed9219e474bbeaf380480235c83')

    echo "Response: $response"

    if [[ "$response" != '{"distance":"failed to measure, try again","time":"failed to measure, try again"}' ]]; then
        echo "Output changed!"
        echo "$response"
        break
    fi

    sleep 0.3 
done