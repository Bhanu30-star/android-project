<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['pname']) && isset($_POST['distributor_id']) && isset($_POST['pphone']) && isset($_POST['address']) && isset($_POST['placesupply']))
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
	$pname=$_POST['pname'];
	$pphone=$_POST['pphone'];
	$paddress = isset($_POST['address']) ? $_POST['address'] : '';
	$pgstin = isset($_POST['pgstin']) ? $_POST['pgstin'] : '';
	$psupply=$_POST['placesupply'];
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_assembly_line where phone_no='$pphone' and distributor_id='$ver'");
	if(mysqli_num_rows($res_product_stock)==0)
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_assembly_line`(`assembly_name`, `phone_no`, `distributor_id`, `gstin_no`, `address`, `place_of_supply`, `tb_insertdate`, `tb_inserttime`, `status`) VALUES ('$pname','$pphone','$ver','$pgstin','$paddress','$psupply','$cdate','$scri','Active')");
		$response['success']='1';
		$response['message']="Insert Successful";			
	}
	else
	{
		$response['success']='1';
		$response['message']="Assembly already exists";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>