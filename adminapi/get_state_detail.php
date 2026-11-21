<?php
include("../../connect.php"); 
$response = array();
$select_user=mysqli_query($con,"select * from tbl_state_master");
if(mysqli_num_rows($select_user)>0)
{     
	$product=array();
	while($fetch_user=mysqli_fetch_array($select_user))
	{
		$product['state_master_id']=$fetch_user['state_master_id'];
		$product['state_code']=$fetch_user['state_code'];
		$product['state_name']=$fetch_user['state_name'];
		$response['state'][]=$product;
	}
}
	
$select_user1=mysqli_query($con,"select * from tbl_btc_distributor_service_detail where company_id='1' and service_id <='8'");
if(mysqli_num_rows($select_user1)>0)
{     
	$service=array();
	while($fetch_user=mysqli_fetch_array($select_user1))
	{
		$service['service_id']=$fetch_user['service_id'];
		$service['service_name']=$fetch_user['service_name'];
		$service['Value']=$fetch_user['Value'];
		$response['service'][]=$service;
	}
}
$response['success']='1';
$response['details']="Fetch Detail Successful";
echo json_encode($response);
?>