<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
{
	$cdate1 = $_POST['start_date'];
	$cdate2 = $_POST['end_date'];
	$session_dist_ver = $_POST['distributor_id'];
	
	$res_product = mysqli_query($con,"select * from tbl_product where `distributor_id` = '$session_dist_ver'");
	while($fetch_data=mysqli_fetch_assoc($res_product))
	{
		$temp_txn_id=$fetch_data['product_id'];
		$res = mysqli_query($con,"select * from tbl_party_transaction_detail where product_id='$temp_txn_id' and transaction_id in (SELECT transaction_id FROM `tbl_party_transaction` where transaction_date>='$cdate1' and transaction_date<='$cdate2' and transaction_from in (select user_id from tbl_user where distributor_id='$session_dist_ver'))");
		$product=array();
		if(mysqli_num_rows($res)>0)
		{     
			$sale_amount=$purchase_amount=0;
			$sale_qty=0;
			while($fetch_product2=mysqli_fetch_array($res))
			{
				$sale_qty=$sale_qty+$fetch_product2['quantity'];
				$product['product_name']=$fetch_product2['product_name'];
				if($fetch_product2['bag_type']>0)
					$sale_amount=$sale_amount+$fetch_product2['bag_qty']*$fetch_product2['product_price'];
				else
					$sale_amount=$sale_amount+$fetch_product2['quantity']*$fetch_product2['product_price'];
				$product['sale_amount']=round($sale_amount,2);
			}
			$product['sale_qty']=round($sale_qty,2);
			$total_c_qty=$sale_qty;
			if($total_c_qty>0)
			{
				$inventory_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and product_id='$temp_txn_id' and txn_type='Add' and transaction_date<='$cdate2' order by id desc");
				if(mysqli_num_rows($inventory_detail)>0)
				{     
					while($fetch_inventory=mysqli_fetch_array($inventory_detail))
					{
						$purchase_qty=$fetch_inventory['quantity'];
						$purchase_txn_id=$fetch_inventory['transaction_id'];
						if($total_c_qty>$purchase_qty)
						{
							$total_c_qty=$total_c_qty-$purchase_qty;
							if($fetch_inventory['bag_type']>0)
								$purchase_amount=$purchase_amount+($fetch_inventory['bag_qty']*$fetch_inventory['product_price']);
							else
								$purchase_amount=$purchase_amount+($purchase_qty*$fetch_inventory['product_price']);
						}
						else
						{
							if($fetch_inventory['bag_type']>0)
							{
								$act_price=$fetch_inventory['product_price']/$fetch_inventory['bag_type'];
								$purchase_amount=$purchase_amount+($total_c_qty*$act_price);
							}
							else
								$purchase_amount=$purchase_amount+($total_c_qty*$fetch_inventory['product_price']);
							$total_c_qty=0;
							break;
						}
					}
				}
			}
			
			$product['purchase_amount']=round($purchase_amount,2);
			$product['profit']=round($sale_amount-$purchase_amount,2);
			$response['Product_profit'][]=$product;
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