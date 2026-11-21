<?php
$response = array();
include("../../connect.php");
if(isset($_POST['distributor_id']))
{  
		
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	
	$query ="INSERT IGNORE INTO tbl_turbo_invoice_skip(distributor_id,insert_date,insert_time)values('$ver','$da','$scro')";
	$res = mysqli_query($con,$query);
	if($res)
	{
		$response['success']=1;
		$response['details']="Turbo Invoice Successfully skip!";
	}
	else
	{
		$response['success']=0;
		$response['details']="Insertion Error...!!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 