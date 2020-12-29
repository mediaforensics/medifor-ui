#!/bin/bash


#set -x
URL="localhost:3000"
PROTOCOL="https"

PARAMS=""
while (( "$#" )); do
  case "$1" in
    -p|--prod)
      URL="consolevip.mediforprogram.com"
      shift 1
      ;;
    -l|--local)
      URL="localhost:3000"
      shift 1
      ;;
    -u|--url)
      URL=$2
      shift 2
      ;;
    -k|--insecure)
      PROTOCOL="http"
      shift 1
      ;;
    -a|--authorization)
      AUTHORIZATION=$2
      shift 2
      ;;
    --) # end argument parsing
      shift
      break
      ;;
    -*|--*=) # unsupported flags
      echo "Error: Unsupported flag $1" >&2
      exit 1
      ;;
    *) # preserve positional arguments
      PARAMS="$PARAMS $1"
      shift
      ;;
  esac
done
# set positional arguments in their proper place
eval set -- "$PARAMS"

FILE=$1

[ ! -f $FILE ] && { echo "$FILE file not found"; exit 99; }

echo -e "$(tput setaf 6)Uploading to: $URL with $FILE  $(tput sgr0)"

while IFS='|', read fname tags;do
    MIME=`file -b --mime-type "$fname"`
    tags=${tags// /} # remove spaces
    echo -n -e "$(tput setaf 7)Uploading" $fname: $MIME "with tags [" $tags "]$(tput sgr0)"
    response=`curl  -s -w "%{http_code}\n" -POST --header "Authorization: $AUTHORIZATION" -H "Content-Type: multipart/form-data" -F probe="@$fname;type=$MIME" -F "tags=$tags" $PROTOCOL://$URL/upload/`
    # status code response of upload
    case $response in
        *201)
        echo -e "$(tput setaf 2)$response$(tput sgr0)";;
        *204)
        echo -e "$(tput setaf 3)$response$(tput sgr0)";;
        *)
        echo -e "$(tput setaf 1)$response$(tput sgr0)";;
    esac

    sleep .25
    
done < $FILE
