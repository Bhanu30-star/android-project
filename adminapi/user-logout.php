<?php

ob_start();

include("../../connect.php");

if(isset($_POST['distributor_user_id']))

{	

	$dis_id = $_POST['distributor_user_id'];

	$response = array();

	$que2=mysqli_query($con,"update tbl_distributor_users set imei_no='',ip_address='',carrier_name='',device_id='' where distributor_user_id='$dis_id'");

	if($que2)

	{

		$response['success']=1;	

		$response['details']="Successfully Logout";

	}

	else

	{

		$response['success']=0;	

		$response['details']="Some error occurred!Not Logout";

	}

}

else

{	

	$response['success']=0;

	$response['details']="Required fields missing";

}

echo json_encode($response);

?> 