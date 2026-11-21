<?php
include("../../connect.php"); 
$response = array();

	$support = mysqli_query($con,"select * from tbl_text_support order by id desc");
	if(mysqli_num_rows($support)>0)
	{     
		$operator_detail=array();
		while($fetch_user=mysqli_fetch_array($support))
		{
			$operator_detail['name'] = $fetch_user['name'];
			$operator_detail['email'] = $fetch_user['email'];
            $operator_detail['phone'] = $fetch_user['phone'];
			$response['support_detail'][] = $operator_detail;
		}
		$response['success']='1';
	    $response['details']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['details']="Detail Doesn't Exist!";	
	}

echo json_encode($response);
?>