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
	$message_query=mysqli_query($con,"select * from tbl_hsn_master_detail");
	$hsn_detail=array();
	if(mysqli_num_rows($message_query)>0)
	{ 
		while($fetch_position=mysqli_fetch_array($message_query))
		{	
			$hsn_detail['id'] = $fetch_position['id'];
			$hsn_detail['hsn_code'] = $fetch_position['hsn_code'];
			$response['hsn_detail'][]=$hsn_detail;
		}
	}
	else
	{
		$response['hsn_detail']=$hsn_detail;
	}
	
	
	$select_category = mysqli_query($con,"SELECT * FROM `tbl_product_category_master` where status='Active' and distributor_id='$dis_id' order by category_name");
	$category_Detail=array();
	if(mysqli_num_rows($select_category)>0)
	{     
		while($fetch_category=mysqli_fetch_assoc($select_category))
		{
			$category_Detail['category_id']=$fetch_category['category_id'];
			$category_Detail['category_name']=$fetch_category['category_name'];
			$category_Detail['sabcategory_detail']=array();
			$select_subcategory = mysqli_query($con,"SELECT * FROM tbl_product_subcategory_master where category_id = '".$fetch_category['category_id']."' and status='Active' order by subcategory_name");
			if(mysqli_num_rows($select_subcategory)>0)
			{     
				while($fetch_subcategory=mysqli_fetch_assoc($select_subcategory))
				{
		        	$sabcategory_detail['subcategory_id']=$fetch_subcategory['subcategory_id'];
					$sabcategory_detail['subcategory_name']=$fetch_subcategory['subcategory_name'];			
					$category_Detail['sabcategory_detail'][]=$sabcategory_detail;
				}
			}
			$response['category_Detail'][]=$category_Detail;
		}
	}
	else
	{
		$response['category_Detail']=$category_Detail;
	}

	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing!!";
}	
echo json_encode($response);
?>