<?php
include("../../connect.php"); 
$response = array();
$response['current_month']= date("m");
$response['current_year']= date("Y");
$response['current_month_detail']= date("M");
		
$party=array();
$party['party_name']='Bharti Hexacom Limited';
$response['party'][]=$party;
$party['party_name']='Airtel Payments Bank';
$response['party'][]=$party;
		
$response['success']='1';
$response['message']="Fetch Detail Successful";
echo json_encode($response);
?>