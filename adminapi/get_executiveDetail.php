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
	
	
	$res1 = mysqli_query($con,"select fse_applicable from tbl_distributor where distributor_id='$ver'");    
	while($fetch_product1=mysqli_fetch_assoc($res1))
	{		
		$response['fse_applicable']=$fetch_product1['fse_applicable'];
	}
	
	$select_user=mysqli_query($con,"select user_id,user_name,user_phone,user_email,invoice_type,status,user_password, work_type, e_recharge_setting,imei_no,billcancel_setting, user_working_type from tbl_user where distributor_id='$ver' and status in ('Active','Deactive')");
	if(mysqli_num_rows($select_user)>0)
	{     
		$product=array();
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$product['user_id']=$fetch_user['user_id'];
			$product['user_name']=$fetch_user['user_name'];
			$product['user_phone']=$fetch_user['user_phone'];
			$product['user_email']=$fetch_user['user_email'];
			$product['invoice_type']=$fetch_user['invoice_type'];
			$product['user_status']=$fetch_user['status'];
			$product['user_password']=$fetch_user['user_password'];
			$product['fos_category']=$fetch_user['work_type'];
			$product['e_recharge_setting']=$fetch_user['e_recharge_setting'];
			$product['billcancel_setting']=$fetch_user['billcancel_setting'];
			$product['user_imei']=$fetch_user['imei_no'];
			$product['user_working_type']=$fetch_user['user_working_type'];
			
			$product['last_sync_date_time']='';
			$select_sale_digital=mysqli_query($con,"SELECT insert_at FROM tbl_client_auto_sync_message_detail where distributor_id='$ver' and type_detail='Sale' and message_type='E-Recharge' and fse_phone='".$fetch_user['user_phone']."' order by insert_at desc limit 1");
			if(mysqli_num_rows($select_sale_digital)>0)
			{     
				while($fetch_product=mysqli_fetch_assoc($select_sale_digital))
				{
					$product['last_sync_date_time']=$fetch_product['insert_at'];
				}
			}
			$response['executive'][]=$product;
		}
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>