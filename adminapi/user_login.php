<?php
ob_start();
include("../../connect.php");
if(isset($_POST['email_id']) && isset($_POST['password']) && isset($_POST['device_id']) && isset($_POST['ip_address']) && isset($_POST['carrier_name']) && isset($_POST['imei_no']) && isset($_POST['app_version']) && isset($_POST['phone_model']) && isset($_POST['phone_manufacturer']) && isset($_POST['sdk_phone_version']))
{
	$mac_id = $_POST['imei_no'];
	$device_id = $_POST['device_id'];
	$email1 = $_POST['email_id'];
	$pass = $_POST['password'];
	$ip_address = $_POST['ip_address'];
	$carrier_name = $_POST['carrier_name'];
	$version_code=isset($_POST['version_code']) ? $_POST['version_code'] : '';
	$app_version = $_POST['app_version'];
	$phone_model = $_POST['phone_model'];
	$phone_manufacturer = $_POST['phone_manufacturer'];
	$sdk_phone_version = $_POST['sdk_phone_version'];
	if($version_code<2)
	{
			$response['success']=0;
			$response['details']="testing New Update available Please update your app";
	}
	else {
	if($mac_id=="")
	{
		$response['success']=0;
		$response['details']="IMEI No not received. Please contact administrator!!";
	}
	else
	{
		$res = mysqli_query($con,"Select * from tbl_distributor_users where password='$pass' and user_role='All' and app_login='Yes' and (distributor_email='$email1' or phone_no='$email1') and status='Active'");
		$row=mysqli_fetch_assoc($res);
		$response = array();
		if(mysqli_num_rows($res)>0)
		{
			$response['distributor_user_id'] = $row['distributor_user_id'];
			$dis_id=$row['distributor_user_id'];

			$query_message=mysqli_query($con,"INSERT INTO `tbl_distributor_users_login`(`distributor_user_id`, `distributor_id`, `distributor_name`, `password`, `phone_no`, `imei_no`, `ip_address`, `app_version`, `version_code`) VALUES ('$dis_id','".$row['distributor_id']."','".$row['distributor_name']."','".$row['password']."','".$row['phone_no']."','".$row['imei_no']."','".$row['ip_address']."','".$row['app_version']."','".$row['version_code']."')");
			
				$que2=mysqli_query($con,"update tbl_distributor_users set imei_no='$mac_id',ip_address='$ip_address',carrier_name='$carrier_name',device_id='$device_id',app_version='$app_version',phone_model='$phone_model',phone_manufacturer='$phone_manufacturer',sdk_phone_version='$sdk_phone_version',version_code='$version_code' where distributor_user_id='$dis_id'");
				$response['distributor_id'] = $row['distributor_id'];
				$response['distributor_name'] = $row['distributor_name'];
				$response['distributor_email'] = $row['distributor_email'];
				$response['distributor_address'] = $row['distributor_address'];
				$response['distributor_phone'] = $row['phone_no'];

				$dis_id=$row['distributor_id'];
				$res_dis = mysqli_query($con,"Select * from tbl_distributor where distributor_id='$dis_id'");
				$row11=mysqli_fetch_assoc($res_dis);
				$response['gstin_no'] = $row11['gstin_no'];
				$response['operator'] = $row11['operator'];
				$response['state_code'] = $row11['state_code'];
				$response['job_work'] = $row11['job_work'];
				$response['doctorapp_type'] = $row11['doctorapp_type'];
				$response['place_of_supply'] = $row11['place_of_supply'];
				$response['milkman_type'] = $row11['milkman_type'];
				$response['stone_crusher'] = $row11['stone_crusher'];
				$response['jobwork_gst_configure'] = $row11['jobwork_gst_configure'];
				$response['distributor_category']=$row11['distributor_category'];
				$response['distributor_logo'] = $row11['image_path'];
				$response['code_no'] = $row11['code_no'];
				$response['bank_name'] = $row11['bank_name'];
				$response['sale_allowed'] = $row11['sale_allowed'];
				$response['DLN_no'] = $row11['DLN_no'];
				$response['pan_no'] = $row11['pan_no'];
				$response['account_no'] = $row11['account_no'];
				$response['branch'] = $row11['branch'];
				$response['account_name'] = $row11['account_name'];
				$response['ifsc_no'] = $row11['ifsc_no'];
				/*$response['serialno_sale'] = $row11['serialno_sale'];*/
				$response['terms_of_delivery'] = $row11['terms_of_delivery'];
				$response['price_editable_config']=$row11['price_editable_config'];
				$response['success']=1;	
				$response['details']="Data Success";



			}
			else
			{
				$response['success']=0;
				$response['details']="Your password or mail id or phone number is not correct !";
			}
		}
		}
}
else
{	
	$response['success']=0;
	$response['details']="Required fields missing";
}
echo json_encode($response);
?> 