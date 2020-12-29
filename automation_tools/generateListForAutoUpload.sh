#/bin/bash

startDir=$(cd "$1" ; pwd)
folder=$(basename $startDir)
outputfile=output.csv
seperator="|"
defaultTag=${folder}


PARAMS=""
while (( "$#" )); do
  case "$1" in
    -o|--outputfile)
      outputfile=$2
      shift 2
      ;;
     -t|--defaultTag)
      defaultTag=$2
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


if test -f "$outputfile"; then
    rm  $outputfile
fi

echo $defaultTag

find "$startDir" -type f | grep -v ".sh\|.csv\|.txt\|.zip\|.rtf"} | while read -r file; do

    printf "${file}" >> $outputfile
    printf $seperator >> $outputfile 


    dir=$(dirname "${file}")
    dir=${dir/$startDir/}
   
    IFS='/ ' read -r -a array <<< "${dir:1}"
   # echo ${array[@]} ${#array[@]}
    if [ ${#array[@]} -eq 1 ]; then
        printf %s "${array[0]}" >> $outputfile 
    elif [ ${#array[@]} -gt 1 ]; then
        printf %s "${array[0]}" >> $outputfile 
        printf ',%s' "${array[@]:1}" >> $outputfile 
    else
        printf "$defaultTag" >> $outputfile
    fi

    printf '\n' >> $outputfile 
done
printf '\n'
