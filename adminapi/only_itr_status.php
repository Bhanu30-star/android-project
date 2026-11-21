<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['distributor_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$dis_id = $_POST['distributor_id'];
	
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
	
	$select_user_detail=mysqli_query($con,"SELECT distributor_name,pan_no,distributor_address FROM tbl_distributor where status='Active' and distributor_id='$dis_id'");
	if(mysqli_num_rows($select_user_detail)>0)
	{     
		$fetch_user_detail=mysqli_fetch_array($select_user_detail);
		$response['distributor_name']=$fetch_user_detail['distributor_name'];
		$response['pan_no']=$fetch_user_detail['pan_no'];
		$response['distributor_address']=$fetch_user_detail['distributor_address'];
	}
	else
	{
		$response['distributor_name']='';
		$response['pan_no']='';
		$response['distributor_address']='';
	}
	
	$select_slider=mysqli_query($con,"SELECT * FROM tbl_admin_slider_detail where status='Active' and Category='ITR'");
	if(mysqli_num_rows($select_slider)>0)
	{     
		$slider_detail=array();
		while($fetch_product=mysqli_fetch_array($select_slider))
		{
			$slider_detail['detail_id']=$fetch_product['detail_id'];
			$slider_detail['image_path']=$fetch_product['image_path'];
			$slider_detail['text_detail']=$fetch_product['text_detail'];
			$response['slider_detail'][]=$slider_detail;
		}
	}
	

	$select_fy_itr_detail=mysqli_query($con,"select * from tbl_btcw_only_itr_status where client_id='$dis_id'");
	$itr_fy_detail=array();
	if(mysqli_num_rows($select_fy_itr_detail)>0)
	{
		while($fetch_data=mysqli_fetch_array($select_fy_itr_detail))
		{	
			$itr_fy_detail['id'] = $fetch_data['id'];
			$itr_fy_detail['fy_year'] = $fetch_data['fy_year'];
			$itr_fy_detail['step_1_document'] = $fetch_data['step_1_document'];
			$itr_fy_detail['step_2_verification'] = $fetch_data['step_2_verification'];
			$itr_fy_detail['step_3_filing'] = $fetch_data['step_3_filing'];
			$itr_fy_detail['step_4_completed'] = $fetch_data['step_4_completed'];
			$itr_fy_detail['step_5_ready_download'] = $fetch_data['step_5_ready_download'];
			$itr_fy_detail['updated_at'] = date("d-M-Y h:i:sa", strtotime($fetch_data['updated_at']));
			
			$document_detail=array();
			$itr_fy_detail['document_detail']=array();
			$fyyear_itrid=$fetch_data['id'];
			$res_doc_detail=mysqli_query($con,"SELECT * FROM tbl_btcw_only_itr_history WHERE client_id='$dis_id' and itr_id='$fyyear_itrid'");
			if(mysqli_num_rows($res_doc_detail)>0)
			{
				while($fetch_doc=mysqli_fetch_assoc($res_doc_detail))
				{
					$document_detail['id']=$fetch_doc['id'];
					$document_detail['itr_form']= 'https://btconnect.in/reports/'.$fetch_doc['itr_form'];
					$document_detail['acknowledgement']= 'https://btconnect.in/reports/'.$fetch_doc['acknowledgement'];
					$document_detail['other_comp']='https://btconnect.in/reports/'.$fetch_doc['other_comp'];
					$document_detail['uploaded_at']=date("d-M-Y h:i:sa", strtotime($fetch_doc['inserted_at']));
					$itr_fy_detail['document_detail'][]=$document_detail;
				}
			}
			else
			{
				$itr_fy_detail['document_detail']=$document_detail;
			}
			$response['itr_fy_detail'][]=$itr_fy_detail;
		}
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		
		if(date("m")>3)
		{
			$fy_year=(date("Y")-1).'-'.date("Y");
		}
		else
		{
			$fy_year=(date("Y")-2).'-'.date("Y");
		}
		$itr_fy_detail['fy_year'] = $fy_year;
		$itr_fy_detail['step_1_document'] = 'Pending';
		$itr_fy_detail['step_2_verification'] = 'Pending';
		$itr_fy_detail['step_3_filing'] = 'Pending';
		$itr_fy_detail['step_4_completed'] = 'Pending';
		$itr_fy_detail['step_5_ready_download'] = 'Pending';
		$document_detail=array();
		$itr_fy_detail['document_detail']=array();
		$itr_fy_detail['document_detail']=$document_detail;
		
		$response['itr_fy_detail'][]=$itr_fy_detail;
		
		$response['success']='0';
		$response['message']="No ITR Document Exists!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required Feild Missing!!";
}	
echo json_encode($response);
?>