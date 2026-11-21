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
	$res = mysqli_query($con,"select *,tbl_distributor_material_transfer.status as dcstatus from tbl_distributor_material_transfer,tbl_assembly_line where tbl_assembly_line.detail_id=tbl_distributor_material_transfer.assembly_line_id and tbl_distributor_material_transfer.distributor_id='$ver' and tbl_distributor_material_transfer.status='Pending' group by tbl_distributor_material_transfer.transfer_bill_no,tbl_distributor_material_transfer.unique_bill order by tbl_distributor_material_transfer.transfer_id desc");
	if(mysqli_num_rows($res)>0)
	{ 
		$c=1; 
		$assemblyissue_detail=array();		
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$bill_no_val=$fetch_product['unique_bill'];
			$assemblyissue_detail['unique_bill']=$fetch_product['unique_bill'];
			$assemblyissue_detail['transfer_bill_no']=$fetch_product['transfer_bill_no'];
			$assemblyissue_detail['assembly_line_id']=$fetch_product['assembly_line_id'];
			$assemblyissue_detail['assembly_name']=$fetch_product['assembly_name'];
			$assemblyissue_detail['phone_no']=$fetch_product['phone_no'];
			$assemblyissue_detail['transaction_date']=$fetch_product['transaction_date'];
			$assemblyissue_detail['transaction_time']=$fetch_product['transaction_time'];
			$assemblyissue_detail['txn_status']=$fetch_product['dcstatus'];
			$assemblyissue_detail['assembly_product_detail']=array();
			$res_query = mysqli_query($con,"select *,tbl_distributor_material_transfer.product_price as pprice from tbl_distributor_material_transfer,tbl_product where tbl_distributor_material_transfer.product_id=tbl_product.product_id and   tbl_distributor_material_transfer.unique_bill='$bill_no_val'");
			if(mysqli_num_rows($res_query)>0)
			{
				while($fetch_consume=mysqli_fetch_assoc($res_query))
				{
					$assembly_product_detail['transfer_id']=$fetch_consume['transfer_id'];
					$assembly_product_detail['product_name']=$fetch_consume['product_name'];
					$assembly_product_detail['bag_type']= $fetch_consume['bag_type'];
					$assembly_product_detail['bag_qty']= $fetch_consume['bag_qty'];
					$assembly_product_detail['quantity']= $fetch_consume['quantity'];
					$assembly_product_detail['pprice']= $fetch_consume['pprice'];
					$assembly_product_detail['amount']=$fetch_consume['quantity']*$fetch_consume['pprice'];
					$assemblyissue_detail['assembly_product_detail'][]=$assembly_product_detail;
				}
			}
			$response['assemblyissue_detail'][]=$assemblyissue_detail;
		}
		$response['success']='1';
	    $response['details']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['details']="Data Not Available";	
	}
}
else 
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>