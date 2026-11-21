<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['operator_name']))
{
	$distributor_id = $_POST['distributor_id'];
	$operator_name = $_POST['operator_name'];
	$res_check = mysqli_query($con,"select * from tbl_distributor_operator_detail where distributor_id='$distributor_id' and operator_name='$operator_name'");
	if(mysqli_num_rows($res_check) == 0)
	{
		$res_update = mysqli_query($con,"insert into tbl_distributor_operator_detail (`distributor_id`,`operator_name`) VALUE ('$distributor_id','$operator_name')");
		$response['success']='1';
	    $response['message']="Operator Added Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['message']="Operator Already Exists!";	
	}
}
else 
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>