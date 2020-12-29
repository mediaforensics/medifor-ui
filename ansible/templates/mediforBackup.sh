#!/bin/sh
set -e

#pgdump the database
docker exec medifor_pgmedifor_1 /usr/bin/pg_dump  -U postgres > {{ medifor_demo_data_dir }}/pg_medifor_dump

#get all the folder and files and zip them all with the current date
TIME=`date +%b-%d-%y`                      # This Command will read the date.
FILENAME=backup-medifor-$TIME.tar.gz       # The filename including the date.
SRCDIR={{ medifor_demo_data_dir }}         # Source backup folder.
DESDIR={{ medifor_backup_dir }}            # Destination of backup file.
tar -cpzf $DESDIR/$FILENAME $SRCDIR        # tar it all up and put in backup folder

#cleanup older backups and make sure to keep at least two
FILECOUNT=$(ls -l {{ medifor_backup_dir }} | wc -l)
echo "File count for {{ medifor_backup_dir }} is $FILECOUNT"
if [ $FILECOUNT -gt 3 ]; then
    find {{ medifor_backup_dir }}  -mindepth 1 -mtime +15 -delete
else
    echo "Not enough files to clear out"
fi
