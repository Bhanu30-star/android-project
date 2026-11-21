<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['turbo_id']) && isset($_POST['distributor_id']))
{
	$tid = $_POST['turbo_id'];
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:sa");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$res = mysqli_query($con,"select * from tbl_digitally_invoice where invoice_id='$tid' and Invoice_CN_status_by_Partner='Pending'");
	if(mysqli_num_rows($res)>0)
	{
		$uq=mysqli_query($con,"UPDATE tbl_digitally_invoice SET Invoice_CN_status_by_Partner='Deleted',accept_datetime='$scri',company_status='Deleted' where invoice_id='$tid'");
	}
	$response['success']='1';
	$response['details']="Invoice Successfully Deleted";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>