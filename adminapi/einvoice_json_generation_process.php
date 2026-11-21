<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['json_detail']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$scro  = date("H:i:s");
	$toder_detail = $_POST['json_detail'];
	$json_data=json_decode($toder_detail, true);     
	foreach ($json_data as $person_data)
	{
		$temp_1 = $person_data['txn_id'];
		$res = mysqli_query($con,"INSERT INTO `tbl_party_einvoice_generation_process`(`distributor_id`,`transaction_id`, `insert_date`,`insert_time`)VALUES('$session_dist_ver','$temp_1','$da','$scro')");
	}
	$response['success']='1';
	$response['details']="E-Invoice JSON Successfully Inserted for Process...!!";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>