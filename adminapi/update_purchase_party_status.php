<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['partid']) && isset($_POST['distributor_id']) && isset($_POST['status']))
{
	$partid1=$_POST['partid'];
	$session_dist_ver = $_POST['distributor_id'];
	$status=$_POST['status'];
	$res_product_stock1 = mysqli_query($con,"SELECT * FROM tbl_purchase_party where distributor_id='$session_dist_ver' and purchase_party_id='$partid1'");
	if(mysqli_num_rows($res_product_stock1)>0)
	{
		$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET status='$status',update_datetime='$cdate' where purchase_party_id='$partid1'");
		$response['success']='1';
		$response['message']="Party Status Successfully Updated!!";
	}
	else
	{	
		$response['success']='0';
		$response['message']="Party Detail Not Exists!!";
	}
}
else
{
	$response['success']='0';
	$response['message']="Error in Purchase Party Updation. Required field missing!!";
}	
echo json_encode($response);

?>