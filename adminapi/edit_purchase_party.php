<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['name']) && isset($_POST['phone']) && isset($_POST['distributor_id']) && isset($_POST['email']) && isset($_POST['gst_no']) && isset($_POST['adddress']))
{
	$partid1=$_POST['partid'];
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$name=mysqli_real_escape_string($con,$_POST['name']);
	$phone=$_POST['phone'];
	$email=$_POST['email'];
	$gst_no=$_POST['gst_no'];
	$address=mysqli_real_escape_string($con,$_POST['adddress']);	
	$psupply=$_POST['psupply'];	
	$dln_no = isset($_POST['dln_no']) ? $_POST['dln_no'] : '';								
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$res_product_stock1 = mysqli_query($con,"SELECT * FROM  tbl_purchase_party where party_name ='$name' and distributor_id='$session_dist_ver' and purchase_party_id!='$partid1'");
	if(mysqli_num_rows($res_product_stock1)<=0)
	{
		$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_purchase_party where purchase_party_id='$partid1'");
		while($fetch_product11=mysqli_fetch_assoc($res_stock1))
		{
			$pname1=mysqli_real_escape_string($con,$fetch_product11['party_name']);
			$bt_party_id=$fetch_product11['bt_party_id'];
			$pphone1=$fetch_product11['party_phone'];
			$paddress1=$fetch_product11['party_address'];
			$pgstin1=$fetch_product11['gstin_no'];
			$party_email1=$fetch_product11['party_email'];
			$party_supply=$fetch_product11['place_of_supply'];
			$query = mysqli_query($con,"insert into tbl_purchase_party_history(purchase_party_id,bt_party_id,party_name,	party_phone,party_email,gstin_no,insert_datetime,party_address,distributor_id,create_by,place_of_supply)values('$partid1','$bt_party_id','$pname1','$pphone1','$party_email1','$pgstin1','$cdate','$paddress1','$session_dist_ver','$session_dist_ver','$party_supply')");
		}
		$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET party_address='$address',update_datetime='$cdate',gstin_no='$gst_no',party_name='$name',party_phone='$phone',party_email='$email',place_of_supply='$psupply',DLN_no='$dln_no' where purchase_party_id='$partid1'");
		if(isset($_POST['party_outstanding']))
		{
			$party_outstanding=$_POST['party_outstanding'];
			$uq_amt=mysqli_query($con,"UPDATE tbl_purchase_party SET outstanding_amount='$party_outstanding' where purchase_party_id='$partid1'");
		}
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver','INSERT+UPDATE OPERATION,Edit purchase party#Admin(INSERT)tbl_purchase_party_history,(UPDATE)tbl_purchase_party', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");	
		$response['success']='1';
		$response['message']="Purchase Party Successfully Updated!!";
	}
	else
	{	
		$response['success']='0';
		$response['message']="Party already exists!!";
	}
}
else
{
	$response['success']='0';
	$response['message']="Error in Purchase Party Updation. Required field missing!!";
}	
echo json_encode($response);

?>