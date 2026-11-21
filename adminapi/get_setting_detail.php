<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
			
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$res1 = mysqli_query($con,"select dsr_pending_days,stock_request_allowed,credit_sale_allowed,dsr_requirement,fse_applicable from tbl_distributor where distributor_id='$ver'");    

	while($fetch_product1=mysqli_fetch_assoc($res1))
	{		
		$dys_value=$fetch_product1['dsr_pending_days'];
		$req_allowed=$fetch_product1['stock_request_allowed'];
		$salereq_allowed=$fetch_product1['credit_sale_allowed'];	
		$response['dsr_requirement']=$fetch_product1['dsr_requirement'];	
		$response['fse_applicable']=$fetch_product1['fse_applicable'];
		$response['dsr_pending_days']=$dys_value;
		$response['stock_request_allowed']=$req_allowed;
		$response['sale_allowed']=$salereq_allowed;
		
	}
	
	$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions where distributor_id='$ver'");
	$a_terms=mysqli_fetch_assoc($res_terms);
	$response['terms_condition1']=$a_terms['terms_condition1'];	
	$response['terms_condition2']=$a_terms['terms_condition2'];	
	$response['terms_condition3']=$a_terms['terms_condition3'];	
	$response['terms_condition4']=$a_terms['terms_condition4'];	
	$response['terms_condition5']=$a_terms['terms_condition5'];	
	$response['terms_condition6']=$a_terms['terms_condition6'];	
	$response['terms_condition7']=$a_terms['terms_condition7'];	
	
	
	$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions where distributor_id='$ver'");
	$a_terms=mysqli_fetch_assoc($res_terms);
	$response['terms_condition1']=$a_terms['terms_condition1'];	
	$response['terms_condition2']=$a_terms['terms_condition2'];	
	$response['terms_condition3']=$a_terms['terms_condition3'];	
	$response['terms_condition4']=$a_terms['terms_condition4'];	
	$response['terms_condition5']=$a_terms['terms_condition5'];	
	$response['terms_condition6']=$a_terms['terms_condition6'];	
	$response['terms_condition7']=$a_terms['terms_condition7'];	
	
	
	$res_terms_hindi = mysqli_query($con,"select * from tbl_dist_terms_conditions_hindi where distributor_id='$ver'");
	$a_terms_hindi=mysqli_fetch_assoc($res_terms_hindi);
	$response['hindi_terms_condition1']=$a_terms_hindi['terms_condition1'];	
	$response['hindi_terms_condition2']=$a_terms_hindi['terms_condition2'];	
	$response['hindi_terms_condition3']=$a_terms_hindi['terms_condition3'];	
	$response['hindi_terms_condition4']=$a_terms_hindi['terms_condition4'];	
	$response['hindi_terms_condition5']=$a_terms_hindi['terms_condition5'];	
	$response['hindi_terms_condition6']=$a_terms_hindi['terms_condition6'];	
	$response['hindi_terms_condition7']=$a_terms_hindi['terms_condition7'];	
	
	
	
	
	
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>