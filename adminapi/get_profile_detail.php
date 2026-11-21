<?php
ob_start();
include("../../connect.php");
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	$res11 = mysqli_query($con,"Select * from tbl_distributor where distributor_id='$dis_id'");
	$row11=mysqli_fetch_assoc($res11);
	$response['gstin_no'] = $row11['gstin_no'];
	$response['distributor_id'] = $row11['distributor_id'];
	$response['distributor_oid'] = $row11['oid'];
	$response['distributor_name'] = $row11['distributor_name'];
	$response['distributor_name_hindi'] = $row11['distributor_name_hindi'];
	$response['distributor_email'] = $row11['distributor_email'];
	$response['distributor_address'] = $row11['distributor_address'];
	$response['distributor_adrs_hindi'] = $row11['distributor_adrs_hindi'];
	$response['distributor_phone'] = $row11['phone_no'];
	$response['business_description'] = $row11['business_description'];
	$response['distributor_mobile'] = $row11['mobile_no'];
	$response['operator'] = $row11['operator'];
	$response['distributor_logo'] = 'https://btconnect.in/primeapi/distributor_logo/'.$row11['image_path'];
	$response['QR_code'] = 'https://btconnect.in/primeapi/distributor_qrcode/'.$row11['QR_code'];
	$response['place_of_supply'] = $row11['place_of_supply'];
	$response['code_no'] = $row11['state_code'];
	$response['bank_name'] = $row11['bank_name'];
	$response['pan_no'] = $row11['pan_no'];
	$response['account_no'] = $row11['account_no'];
	$response['branch'] = $row11['branch'];
	$response['account_name'] = $row11['account_name'];
	$response['ifsc_no'] = $row11['ifsc_no'];
	$response['terms_of_delivery'] = $row11['terms_of_delivery'];
	
	$response['gst_username'] = $row11['gst_username'];
	$response['gst_password'] = $row11['gst_password'];
	$response['itr_username'] = $row11['itr_username'];
	$response['itr_password'] = $row11['itr_password'];
	
	
	
	$response['success']=1;	
	$response['details']="Data Success";
}
else
{
	$response['success']=0;
	$response['details']="Required fields missing";
}
echo json_encode($response);
?> 