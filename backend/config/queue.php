<?php
return ['default'=>env('QUEUE_CONNECTION','database'),'connections'=>['database'=>['driver'=>'database','connection'=>env('DB_QUEUE_CONNECTION'),'table'=>'jobs','queue'=>'default','retry_after'=>120,'after_commit'=>false]],'failed'=>['driver'=>'database-uuids','database'=>env('DB_CONNECTION','sqlite'),'table'=>'failed_jobs']];
