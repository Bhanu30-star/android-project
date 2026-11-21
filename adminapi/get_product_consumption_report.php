<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['start_date']) && isset($_POST['distributor_id']) && isset($_POST['end_date']))
{
	$cdate1  = $_POST['start_date'];
	$cdate2  = $_POST['end_date'];
	
	$temp_string=explode("-",$cdate1);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate1=date("Y-m-d",$temp_date2);
	
	$temp_string=explode("-",$cdate2);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate2=date("Y-m-d",$temp_date2);
	
	$session_dist_ver = $_POST['distributor_id'];
	$final_flag=0;
	$res = mysqli_query($con,"select * from tbl_product where distributor_id='$session_dist_ver' and consumable_raw_product='Yes' order by product_name asc");
	if(mysqli_num_rows($res)>0)
	{    
		$product=array();
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$pro_id=$fetch_product['product_id'];
			$total_sale_val=0;
			$res_consume = mysqli_query($con,"select sum(quantity) as t_sale_val from tbl_party_transaction_detail where consume_detail ='Yes' and product_id='$pro_id' and transaction_id in (select transaction_id from tbl_party_transaction where transaction_date >='$cdate1' and transaction_date <='$cdate2')");
			while($fetch_sale=mysqli_fetch_assoc($res_consume))
			{
				$total_sale_val=$fetch_sale['t_sale_val'];
			}										
														
			$res_query = mysqli_query($con,"select tbl_product.product_name,sum(tbl_party_transaction_consumable_detail.total_qty_consume) as total_consume_val,sum(tbl_party_transaction_consumable_detail.consume_quantity) as c_val from tbl_party_transaction_detail,tbl_party_transaction_consumable_detail,tbl_product where tbl_party_transaction_detail.transaction_detail_id=tbl_party_transaction_consumable_detail.transaction_detail_id and tbl_party_transaction_consumable_detail.consume_product_id = tbl_product.product_id and tbl_party_transaction_detail.consume_detail ='Yes' and tbl_party_transaction_detail.product_id='$pro_id' and tbl_party_transaction_detail.transaction_id in (select transaction_id from tbl_party_transaction where transaction_date >='$cdate1' and transaction_date <='$cdate2') group by tbl_party_transaction_consumable_detail.consume_product_id,tbl_party_transaction_consumable_detail.consume_quantity");
			if($total_sale_val>0)
			{
				$final_flag=1;
				$product['product_id']=$fetch_product['product_id'];
				$product['product_name']=$fetch_product['product_name'];
				$product['total_sale_qty']=$total_sale_val;
				$product['consume_detail']=array();
				while($fetch_product11=mysqli_fetch_assoc($res_query))
				{
					$consume_detail['consume_product_name']=$fetch_product11['product_name'];
					$consume_detail['consume_qty']= $fetch_product11['c_val'];
					$consume_detail['total_consume_qty']= $fetch_product11['total_consume_val'];
					$product['consume_detail'][]=$consume_detail;
				}
				$response['product'][]=$product;
			}
		}
	}
	if($final_flag==1)
	{
		$response['success']='1';
		$response['message']="NO Data Available";
	}
	else
	{
		$response['success']='0';
		$response['message']="Fetch Detail Successful";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing";
}	
echo json_encode($response);
?>