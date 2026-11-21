<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$res = mysqli_query($con,"select * from tbl_distributor_operator_detail where distributor_id='$session_dist_ver' order by operator_name asc");
	if(mysqli_num_rows($res)>0)
	{     
		$operator_detail=array();
		while($fetch_user=mysqli_fetch_array($res))
		{
			$operator_detail['detail_id'] = $fetch_user['detail_id'];
			$operator_detail['operator_name'] = $fetch_user['operator_name'];
			$operator_detail['status'] = $fetch_user['status'];
			$response['operator_detail'][] = $operator_detail;
		}
		$response['success']='1';
	    $response['message']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['message']="Detail Doesn't Exist!";	
	}
}
else 
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>