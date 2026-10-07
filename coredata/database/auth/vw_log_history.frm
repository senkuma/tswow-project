TYPE=VIEW
query=(select from_unixtime(min(`auth`.`logs`.`time`)) AS `First Logged`,from_unixtime(max(`auth`.`logs`.`time`)) AS `Last Logged`,count(0) AS `Occurrences`,`auth`.`realmlist`.`name` AS `Realm`,`auth`.`logs`.`type` AS `type`,`auth`.`logs`.`level` AS `level`,`auth`.`logs`.`string` AS `string` from (`auth`.`logs` left join `auth`.`realmlist` on((`auth`.`logs`.`realm` = `auth`.`realmlist`.`id`))) group by `auth`.`logs`.`string`,`auth`.`logs`.`type`,`auth`.`logs`.`realm`)
md5=7429a937f640e0a117ec65e0e84adaa0
updatable=0
algorithm=0
definer_user=root
definer_host=localhost
suid=2
with_check_option=0
timestamp=2026-10-05 17:34:13
create-version=1
source=(select from_unixtime(min(`logs`.`time`)) AS `First Logged`,from_unixtime(max(`logs`.`time`)) AS `Last Logged`,count(0) AS `Occurrences`,`realmlist`.`name` AS `Realm`,`logs`.`type` AS `type`,`logs`.`level` AS `level`,`logs`.`string` AS `string` from (`logs` left join `realmlist` on((`logs`.`realm` = `realmlist`.`id`))) group by `logs`.`string`,`logs`.`type`,`logs`.`realm`)
client_cs_name=utf8
connection_cl_name=utf8_general_ci
view_body_utf8=(select from_unixtime(min(`auth`.`logs`.`time`)) AS `First Logged`,from_unixtime(max(`auth`.`logs`.`time`)) AS `Last Logged`,count(0) AS `Occurrences`,`auth`.`realmlist`.`name` AS `Realm`,`auth`.`logs`.`type` AS `type`,`auth`.`logs`.`level` AS `level`,`auth`.`logs`.`string` AS `string` from (`auth`.`logs` left join `auth`.`realmlist` on((`auth`.`logs`.`realm` = `auth`.`realmlist`.`id`))) group by `auth`.`logs`.`string`,`auth`.`logs`.`type`,`auth`.`logs`.`realm`)
