<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['invoicetype']) && isset($_POST['fse_id']) && isset($_POST['distributor_id']))
{
	$invoicetype1 = $_POST['invoicetype'];
	$erecharge_type = isset($_POST['erecharge_type']) ? $_POST['erecharge_type'] : 'No';
	$usrid = $_POST['fse_id'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$rs=mysqli_query($con,"select invoice_type,e_recharge_setting from tbl_user where distributor_id='$ver' and user_id='$usrid'");
	$num=mysqli_num_rows($rs);
	if($num>0)
	{
		while($fetch_product=mysqli_fetch_assoc($rs))
		{
			$i_type=$fetch_product['invoice_type'];
			$r_type=$fetch_product['e_recharge_setting'];
			$query = mysqli_query($con,"INSERT IGNORE INTO  tbl_user_history(user_id,invoice_type,type,datetime,e_recharge_setting)values('$usrid','$i_type','Invoice Type Change','$cdate','$r_type')");
		}
		$uq1=mysqli_query($con,"update tbl_user set invoice_type='$invoicetype1',e_recharge_setting='$erecharge_type' where distributor_id='$ver' and user_id='$usrid'");
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$ver', 'INSERT+UPDATE OPERATION,Edit Executive Type#Admin(INSERT)tbl_user_history,(UPDATE)tbl_user', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')"); 
	}
	$response['success']='1';
	$response['message']="FSE Detail Successfully Update";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>